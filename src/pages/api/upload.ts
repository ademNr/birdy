import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import multer from 'multer';
import path from 'path';
import connectDB from '../../../lib/mongodb';
import Document from '../../../models/Document';
import { isFileSupported, extractTextFromBuffer } from '../../../lib/fileProcessor';
import { supabase, STORAGE_BUCKET } from '../../../lib/supabase';

// Configure multer to use memory storage (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (isFileSupported(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60, // 60 seconds for Vercel Pro, 10s for Hobby
};

const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectDB();

    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ 
        error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.' 
      });
    }

    // Handle file upload to memory (no disk writes)
    await runMiddleware(req, res, upload.array('files', 10));

    const files = (req as any).files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = session.user.id;
    const savedDocuments = [];

    for (const file of files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const supabasePath = `${userId}/${uniqueFileName}`;

      // File buffer is already in memory from multer
      const fileBuffer = file.buffer;

      // Extract text from buffer before uploading (faster, no disk I/O)
      let extractedText = '';
      try {
        extractedText = await extractTextFromBuffer(fileBuffer, fileExtension, file.originalname);
        console.log(`Extracted ${extractedText.length} characters from ${file.originalname}`);
      } catch (error) {
        console.error(`Error extracting text from ${file.originalname}:`, error);
        // Continue even if text extraction fails - we can try again later
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(supabasePath, fileBuffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: false, // Don't overwrite existing files
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ 
          error: `Failed to upload file to storage: ${uploadError.message}` 
        });
      }

      // Save document to database with Supabase path and extracted text
      const document = await Document.create({
        userId,
        fileName: uniqueFileName,
        originalName: file.originalname,
        fileType: fileExtension,
        fileSize: file.size,
        filePath: supabasePath, // Store Supabase storage path
        extractedText, // Store extracted text in database
        processed: false,
      });

      savedDocuments.push({
        id: document._id,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
      });
    }

    return res.status(200).json({
      message: 'Files uploaded successfully',
      documents: savedDocuments,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

