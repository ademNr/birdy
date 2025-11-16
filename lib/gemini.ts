import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get Gemini model - using gemini-2.5-flash
// IMPORTANT: The same model is used for ALL languages (English, French, Arabic)
// Only the prompt content changes based on outputLanguage, not the model itself
export function getGeminiModel() {
  // Use gemini-2.5-flash as requested
  // Used consistently for English, French, and Arabic generation
  const modelName = 'gemini-2.5-flash';

  console.log('[Gemini] Getting model with name:', modelName);
  console.log('[Gemini] API Key exists:', !!process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log('[Gemini] Model created successfully');
    return model;
  } catch (error) {
    console.error('[Gemini] Error creating model:', error);
    throw error;
  }
}

export interface AIResponse {
  summary?: string;
  keyPoints?: string[];
  formulas?: Array<{
    formula: string;
    description: string;
    context: string;
  }>;
  examQuestions?: Array<{
    question: string;
    answer: string;
    type: 'short' | 'long' | 'essay';
  }>;
  mcqs?: Array<{
    question: string;
    options: string[];
    correctAnswer: number | number[]; // Support both single and multiple correct answers
    explanation?: string;
  }>;
  flashcards?: Array<{
    front: string;
    back: string;
    category?: string;
  }>;
  youtubeVideos?: Array<{
    title: string;
    description: string;
    searchQuery: string; // YouTube search query to find the video
    relevance: string; // Why this video is relevant
  }>;
  studyPlan?: {
    schedule: Array<{
      date: string;
      topics: string[];
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
    totalDays: number;
  };
  chapterInfo?: {
    order: number;
    title: string;
    content: string;
  };
}

export async function processStudyMaterial(
  text: string,
  features: {
    summary?: boolean;
    keyPoints?: boolean;
    formulas?: boolean;
    examQuestions?: boolean;
    mcqs?: boolean;
    flashcards?: boolean;
    studyPlan?: { difficulty?: string };
  },
  outputLanguage: 'english' | 'french' | 'arabic' = 'english'
): Promise<AIResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your .env.local file.');
  }

  // Limit text length to avoid token limits (Gemini has context limits)
  // Using a large limit to ensure we capture as much content as possible
  const maxTextLength = 2000000; // ~2M characters for comprehensive analysis
  const truncatedText = text.length > maxTextLength
    ? text.substring(0, maxTextLength) + '\n\n[Content truncated due to length - analyzing first 2M characters...]'
    : text;

  const prompt = buildPrompt(truncatedText, features, outputLanguage);

  try {
    const model = getGeminiModel();
    console.log('[Gemini] Calling generateContent with model...');
    const result = await model.generateContent(prompt);
    console.log('[Gemini] generateContent completed successfully');
    const response = await result.response;
    const textResponse = response.text();

    if (!textResponse || textResponse.trim().length === 0) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON response
    let jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    }

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('JSON string:', jsonStr.substring(0, 500));
        throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    // Fallback: try to parse the entire response as JSON
    try {
      return JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response preview:', textResponse.substring(0, 500));
      throw new Error(`AI response is not valid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error: unknown) {
    console.error('Error processing with Gemini:', error);

    if (error instanceof Error) {
      // Log the full error for debugging
      console.error('Full error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });

      // Check for specific error types
      if (error.message.includes('API_KEY') || error.message.includes('api key')) {
        throw new Error('Invalid or missing GEMINI_API_KEY. Please check your .env.local file.');
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('API quota exceeded or rate limited. Please try again later.');
      }
      if (error.message.includes('model') || error.message.includes('Model') || error.message.includes('400')) {
        console.error('Model error - attempted model name: gemini-2.5-flash');
        console.error('Full error message:', error.message);
        // Check if it's a 400 error which often indicates invalid model name
        throw new Error(`Invalid model name: gemini-2.5-flash. Error: ${error.message}. Please check the Gemini API documentation for valid model names.`);
      }
      throw new Error(`AI processing failed: ${error.message}`);
    }

    throw new Error('Failed to process study material with AI. Please check your GEMINI_API_KEY and try again.');
  }
}

function buildPrompt(text: string, features: any, outputLanguage: 'english' | 'french' | 'arabic' = 'english'): string {
  // Use the selected output language
  const language = outputLanguage === 'french' ? 'French' : outputLanguage === 'arabic' ? 'Arabic' : 'English';

  let prompt = `You are an AI Study Assistant. Analyze the following study material THOROUGHLY and provide a comprehensive, DETAILED JSON response.

IMPORTANT: 
- You MUST respond in ${language}. All summaries, key points, questions, and explanations must be in ${language}.
- Analyze the ENTIRE content - do not skip any important details
- Extract MAXIMUM information - be comprehensive and detailed
- Make sure students don't miss anything important from the material

STUDY MATERIAL:
${text}

INSTRUCTIONS:
1. Read and analyze the ENTIRE content carefully - every paragraph, every section
2. Identify ALL chapters, sections, subsections, and their order
3. Extract ALL requested information with maximum detail
4. Generate as many questions, MCQs, and flashcards as possible - QUANTITY IS KEY
5. Return ONLY valid JSON, no markdown formatting or explanations outside JSON

REQUIRED JSON FORMAT:
{
`;

  if (features.summary) {
    prompt += `  "summary": "A concise and clear summary (1-2 paragraphs maximum, 3-5 sentences) in ${language} that explains what this chapter/material is about. Focus on the main topic and purpose. Keep it brief, clear, and to the point - the objective is to explain what the chapter is about, not to provide every detail.",
`;
  }

  if (features.keyPoints) {
    prompt += `  "keyPoints": ["Really important key point 1 in ${language}", "Really important key point 2 in ${language}", ...],
NOTE: Focus on DEFINITIONS and really important key points. Include ALL important definitions from the chapter - these are critical. Also include the most critical concepts and ideas that students absolutely must know. Prioritize definitions as they are essential for understanding. Do not include minor details - only highlight the essential information, especially definitions.
`;
  }

  if (features.formulas) {
    prompt += `  "formulas": [
    {
      "formula": "Mathematical formula in LaTeX or text format",
      "description": "What this formula represents (in ${language})",
      "context": "Where/when to use this formula (in ${language})"
    }
  ],
NOTE: Only include formulas if they actually exist in the material. If no formulas exist, return an empty array [].
`;
  }

  if (features.examQuestions) {
    prompt += `  "examQuestions": [
    {
      "question": "Exam-simulated question in ${language}",
      "answer": "Very short and concise answer in ${language} (1 sentence maximum, 10-20 words). Focus on the key point only, not lengthy explanations. Keep it extremely brief and exam-like.",
      "type": "short" | "long" | "essay"
    }
  ],
NOTE: Generate at least 10 exam-simulated questions minimum. Questions should be short and concise, covering different topics. Answers should be VERY SHORT (1 sentence, 10-20 words maximum). They should simulate real exam questions - short and to the point. Generate more questions (15-20) for longer or more complex chapters.
`;
  }

  if (features.mcqs) {
    prompt += `  "mcqs": [
    {
      "question": "Multiple choice question in ${language}",
      "options": ["Option A in ${language}", "Option B in ${language}", "Option C in ${language}", "Option D in ${language}"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct (in ${language})"
    }
  ],
NOTE: Generate at least 15 MCQs minimum. For longer or more difficult chapters, generate even more (20-30 MCQs). correctAnswer can be a single number (0-3) for single-answer questions, or an array of numbers like [0, 2] for multiple-answer questions. Use arrays only when multiple options are genuinely correct. Generate diverse questions covering all aspects of the material. Adjust quantity based on chapter length and difficulty.
`;
  }

  if (features.flashcards) {
    prompt += `  "flashcards": [
    {
      "front": "Question or term in ${language}",
      "back": "Answer or definition in ${language} with key information",
      "category": "Category name"
    }
  ],
NOTE: Generate as many flashcards as possible - QUANTITY IS KEY. Create flashcards for ALL important terms, concepts, definitions, and key ideas from the material. Aim for 40-60 flashcards minimum covering all important information from the chapter. Include everything important - definitions, concepts, formulas, key facts, etc.
`;
  }

  // Always include YouTube video suggestions for revision
  prompt += `  "youtubeVideos": [
    {
      "title": "Suggested video title that would help students understand this topic",
      "description": "Brief description of what the video covers and why it's relevant",
      "searchQuery": "YouTube search query to find this video (in ${language})",
      "relevance": "Why this video is relevant to the chapter content"
    }
  ],
NOTE: Suggest A LOT of YouTube videos (8-15 videos minimum) related to every important detail in this chapter. For each important concept, topic, definition, or key point, suggest a relevant video. Cover all important aspects of the chapter with specific video suggestions. Focus on educational channels and clear explanations. The searchQuery should be in ${language} and specific enough to find relevant videos. Generate videos for: definitions, key concepts, formulas, examples, applications, and any other important details.
`;

  if (features.studyPlan) {
    prompt += `  "studyPlan": {
    "schedule": [
      {
        "date": "YYYY-MM-DD",
        "topics": ["Topic 1", "Topic 2"],
        "difficulty": "easy" | "medium" | "hard"
      }
    ],
    "totalDays": 7
  },
`;
  }

  prompt += `  "chapterInfo": {
    "order": 1,
    "title": "Chapter title if detected",
    "content": "Brief description"
  }
}

IMPORTANT:
- If chapters are detected, organize content by chapter order
- Extract ALL formulas, even if written in different formats
- Generate diverse question types
- Make flashcards concise but informative
- Study plan should be realistic and spread over available days
- Return ONLY the JSON object, no additional text`;

  return prompt;
}

export async function detectChapterOrder(texts: string[], fileNames: string[]): Promise<Array<{ order: number; title: string; content: string; fileIndex: number }>> {
  const combinedText = texts.map((t, i) => `---FILE ${i + 1}: ${fileNames[i]}---\n${t.substring(0, 2000)}`).join('\n\n');

  const prompt = `Analyze these study materials and determine their chapter order, titles, and organization. Each file represents a chapter.

FILES:
${combinedText}

IMPORTANT:
- Extract the chapter title from each file's content (look for titles, headings, chapter numbers)
- Determine the correct order (first, second, third, last, etc.) based on content analysis
- If the file name contains chapter information, use it
- If order cannot be determined from content, use file order

Return a JSON array of chapters in order:
[
  {
    "order": 1,
    "title": "Extracted chapter title from content or filename",
    "content": "Brief description of chapter content",
    "fileIndex": 0
  }
]

Return ONLY valid JSON array.`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
      textResponse.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      // Ensure fileIndex is included
      return parsed.map((ch: any, i: number) => ({
        ...ch,
        fileIndex: ch.fileIndex !== undefined ? ch.fileIndex : i,
      }));
    }

    const parsed = JSON.parse(textResponse);
    return parsed.map((ch: any, i: number) => ({
      ...ch,
      fileIndex: ch.fileIndex !== undefined ? ch.fileIndex : i,
    }));
  } catch (error) {
    console.error('Error detecting chapter order:', error);
    // Fallback: return files in order with extracted titles
    return texts.map((text, i) => {
      // Try to extract title from filename
      const fileName = fileNames[i] || `File ${i + 1}`;
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();

      return {
        order: i + 1,
        title: nameWithoutExt || `Chapter ${i + 1}`,
        content: text.substring(0, 200),
        fileIndex: i,
      };
    });
  }
}

export async function extractChapterTitle(text: string, fileName: string, outputLanguage: 'english' | 'french' | 'arabic' = 'english'): Promise<string> {
  const language = outputLanguage === 'french' ? 'French' : outputLanguage === 'arabic' ? 'Arabic' : 'English';
  const textPreview = text.substring(0, 3000);

  const prompt = `Extract the chapter title from this study material. Look for:
- Chapter headings (Chapter 1, Chapter 2, etc.)
- Title pages
- Main headings at the beginning
- File name hints: ${fileName}

CONTENT PREVIEW:
${textPreview}

Return ONLY the chapter title (3-10 words maximum), no explanations, no quotes, just the title. If no clear title is found, suggest a descriptive title based on the content.`;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();

    // Clean up the title
    const cleanTitle = title
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanTitle && cleanTitle.length > 3 && cleanTitle.length < 150) {
      return cleanTitle;
    }

    // Fallback: use filename
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
    return nameWithoutExt || 'Untitled Chapter';
  } catch (error) {
    console.error('Error extracting chapter title:', error);
    // Fallback: use filename
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
    return nameWithoutExt || 'Untitled Chapter';
  }
}

