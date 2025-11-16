import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { supabase, STORAGE_BUCKET } from './supabase';

// Check if filePath is a Supabase storage path (doesn't start with /)
function isSupabasePath(filePath: string): boolean {
  return !path.isAbsolute(filePath) && !filePath.startsWith('/tmp') && !filePath.startsWith('./');
}

// Download file from Supabase Storage to temporary location
async function downloadFromSupabase(supabasePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(supabasePath);

  if (error) {
    throw new Error(`Failed to download file from Supabase: ${error.message}`);
  }

  // Convert blob to buffer and save to temp file
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Save to temp location
  const tempDir = process.env.VERCEL || process.env.VERCEL_ENV ? '/tmp' : path.join(process.cwd(), 'uploads', 'temp');
  if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch {}
  }
  
  const tempFilePath = path.join(tempDir, `${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await fs.writeFile(tempFilePath, buffer);
  
  return tempFilePath;
}

// Extract text directly from buffer (for memory storage)
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileExtension: string,
  originalName: string
): Promise<string> {
  // Save buffer to temp file for processing (libraries need file paths)
  const tempDir = process.env.VERCEL || process.env.VERCEL_ENV ? '/tmp' : path.join(process.cwd(), 'uploads', 'temp');
  if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch {}
  }
  
  const tempFilePath = path.join(tempDir, `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`);
  
  try {
    // Write buffer to temp file
    await fs.writeFile(tempFilePath, buffer);
    
    // Extract text using existing file-based function
    const result = await extractTextFromFile(tempFilePath, fileExtension);
    
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.warn('Failed to delete temp file:', error);
    }
    
    return result;
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempFilePath);
    } catch {}
    throw error;
  }
}

export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  let actualFilePath = filePath;
  let isTempFile = false;

  // If it's a Supabase path, download it first
  if (isSupabasePath(filePath)) {
    try {
      actualFilePath = await downloadFromSupabase(filePath);
      isTempFile = true;
    } catch (error) {
      console.error('Error downloading from Supabase:', error);
      throw error;
    }
  }

  const fileExtension = path.extname(actualFilePath).toLowerCase();

  try {
    let result: string;
    
    switch (fileExtension) {
      case '.pdf':
        result = await extractFromPDF(actualFilePath);
        break;
      
      case '.doc':
      case '.docx':
        result = await extractFromWord(actualFilePath);
        break;
      
      case '.ppt':
      case '.pptx':
        result = await extractFromPowerPoint(actualFilePath);
        break;
      
      case '.txt':
        result = await extractFromText(actualFilePath);
        break;
      
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    // Clean up temp file if we downloaded it
    if (isTempFile) {
      try {
        await fs.unlink(actualFilePath);
      } catch (error) {
        console.warn('Failed to delete temp file:', error);
      }
    }

    return result;
  } catch (error) {
    // Clean up temp file on error
    if (isTempFile) {
      try {
        await fs.unlink(actualFilePath);
      } catch {}
    }
    console.error(`Error extracting text from ${filePath}:`, error);
    throw error;
  }
}

async function extractFromPDF(filePath: string): Promise<string> {
  // Use pdf2json - a Node.js-compatible PDF parser (no browser dependencies)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require('pdf2json');
  
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    
    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(new Error(`PDF parsing error: ${errData.parserError}`));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        let fullText = '';
        
        // Extract text from all pages
        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          for (const page of pdfData.Pages) {
            if (page.Texts && Array.isArray(page.Texts)) {
              for (const textItem of page.Texts) {
                if (textItem.R && Array.isArray(textItem.R)) {
                  for (const run of textItem.R) {
                    if (run.T) {
                      // Decode URI-encoded text
                      try {
                        fullText += decodeURIComponent(run.T) + ' ';
                      } catch {
                        // If decoding fails, use the text as-is
                        fullText += run.T + ' ';
                      }
                    }
                  }
                }
              }
              fullText += '\n\n';
            }
          }
        }
        
        if (!fullText.trim()) {
          reject(new Error('No text content found in PDF'));
          return;
        }
        
        resolve(fullText.trim());
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`Failed to extract text from PDF: ${errorMessage}`));
      }
    });
    
    // Load the PDF
    pdfParser.loadPDF(filePath);
  });
}

async function extractFromWord(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractFromPowerPoint(filePath: string): Promise<string> {
  // PPTX files are ZIP archives containing XML files
  // We'll extract text from the slide XML files
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();
  
  let extractedText = '';
  
  // Look for slide XML files (ppt/slides/slide*.xml)
  const slideEntries = zipEntries.filter((entry: any) => 
    entry.entryName.match(/ppt\/slides\/slide\d+\.xml/)
  );
  
  for (const entry of slideEntries) {
    const content = entry.getData().toString('utf8');
    // Extract text from XML (simple regex approach)
    // In production, you might want to use proper XML parsing
    const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      textMatches.forEach((match: string) => {
        const text = match.replace(/<[^>]*>/g, '');
        if (text.trim()) {
          extractedText += text + ' ';
        }
      });
    }
    extractedText += '\n';
  }
  
  if (!extractedText.trim()) {
    throw new Error('Could not extract text from PowerPoint file');
  }
  
  return extractedText.trim();
}

async function extractFromText(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

// Supported file extensions
export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
];

export function isFileSupported(fileName: string): boolean {
  const extension = path.extname(fileName).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension);
}

