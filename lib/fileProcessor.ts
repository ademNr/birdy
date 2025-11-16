import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  const fileExtension = path.extname(filePath).toLowerCase();

  try {
    switch (fileExtension) {
      case '.pdf':
        return await extractFromPDF(filePath);
      
      case '.doc':
      case '.docx':
        return await extractFromWord(filePath);
      
      case '.ppt':
      case '.pptx':
        return await extractFromPowerPoint(filePath);
      
      case '.txt':
        return await extractFromText(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } catch (error) {
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

