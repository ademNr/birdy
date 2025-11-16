import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import connectDB from '../../../lib/mongodb';
import Document from '../../../models/Document';
import { isFileSupported } from '../../../lib/fileProcessor';

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Handle file upload
    await runMiddleware(req, res, upload.array('files', 10));

    const files = (req as any).files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = session.user.id;
    const savedDocuments = [];

    for (const file of files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Move file to permanent location
      await fs.rename(file.path, filePath);

      // Save document to database
      const document = await Document.create({
        userId,
        fileName,
        originalName: file.originalname,
        fileType: fileExtension,
        fileSize: file.size,
        filePath,
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

