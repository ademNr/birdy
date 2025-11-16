import { getGeminiModel } from './gemini';

export async function detectMaterialName(fileNames: string[], textPreview?: string): Promise<string> {
  // First, try to extract a meaningful name from file names
  const combinedFileNames = fileNames.join(', ');
  
  // If we have a text preview, use AI to suggest a name
  if (textPreview && textPreview.length > 100) {
    try {
      const model = getGeminiModel();
      const prompt = `Analyze these file names and a preview of the content, then suggest a concise, descriptive title for this study material.

File names: ${combinedFileNames}

Content preview: ${textPreview.substring(0, 500)}

Return ONLY a title (3-8 words maximum), no explanations, no quotes, just the title.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestedTitle = response.text().trim();
      
      // Clean up the title (remove quotes, extra spaces, etc.)
      const cleanTitle = suggestedTitle
        .replace(/^["']|["']$/g, '')
        .replace(/\n/g, ' ')
        .trim();
      
      if (cleanTitle && cleanTitle.length > 3 && cleanTitle.length < 100) {
        return cleanTitle;
      }
    } catch (error) {
      console.error('Error detecting material name:', error);
    }
  }
  
  // Fallback: extract from file names
  if (fileNames.length === 1) {
    // Single file - use its name (cleaned up)
    const fileName = fileNames[0];
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const cleaned = nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || 'Study Material';
  }
  
  // Multiple files - try to find common pattern
  const commonPrefix = findCommonPrefix(fileNames);
  if (commonPrefix && commonPrefix.length > 3) {
    return commonPrefix.trim();
  }
  
  // Last resort
  return `Study Material - ${fileNames.length} files`;
}

function findCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  
  const first = strings[0].replace(/\.[^/.]+$/, ''); // Remove extension
  let prefix = '';
  
  for (let i = 0; i < first.length; i++) {
    const char = first[i];
    if (strings.every(s => s.replace(/\.[^/.]+$/, '').startsWith(prefix + char))) {
      prefix += char;
    } else {
      break;
    }
  }
  
  // Clean up the prefix
  return prefix
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

