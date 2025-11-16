import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../lib/mongodb';
import Document from '../../../models/Document';
import StudyMaterial from '../../../models/StudyMaterial';
import { extractTextFromFile } from '../../../lib/fileProcessor';
import { processStudyMaterial, detectChapterOrder, extractChapterTitle } from '../../../lib/gemini';
import { detectMaterialName } from '../../../lib/materialNameDetector';

// Configure timeout for Vercel
export const config = {
  maxDuration: 300, // 300 seconds (5 minutes) for Vercel Pro
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session || !session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { documentIds, features, title, outputLanguage } = req.body;

        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({ error: 'Document IDs are required' });
        }

        if (!features || typeof features !== 'object') {
            return res.status(400).json({ error: 'Features configuration is required' });
        }

        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return res.status(500).json({ error: 'AI service is not configured. Please set GEMINI_API_KEY in your environment variables.' });
        }

        await connectDB();

        const userId = session.user.id;

        // Convert documentIds to MongoDB ObjectIds
        const objectIds = documentIds.map((id: string) => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch {
                throw new Error(`Invalid document ID format: ${id}`);
            }
        });

        // Fetch documents
        const documents = await Document.find({
            _id: { $in: objectIds },
            userId: new mongoose.Types.ObjectId(userId),
        });

        if (documents.length === 0) {
            return res.status(404).json({ error: 'Documents not found. Make sure the files were uploaded successfully.' });
        }

        if (documents.length !== documentIds.length) {
            console.warn(`Found ${documents.length} documents but expected ${documentIds.length}`);
        }

        // Use stored extracted text from database (extracted during upload)
        // This is necessary for Vercel compatibility where files are ephemeral
        const extractedTexts: string[] = [];
        for (const doc of documents) {
            try {
                // Use stored extracted text if available
                if (doc.extractedText && doc.extractedText.trim().length > 0) {
                    extractedTexts.push(doc.extractedText);
                    console.log(`Using stored text for ${doc.originalName} (${doc.extractedText.length} characters)`);
                } else {
                    // Fallback: try to extract from file if stored text is not available
                    // This works locally but may fail on Vercel
                    if (doc.filePath) {
                        try {
                            const text = await extractTextFromFile(doc.filePath, doc.fileType);
                            if (text && text.trim().length > 0) {
                                extractedTexts.push(text);
                                // Update document with extracted text
                                doc.extractedText = text;
                                await doc.save();
                                console.log(`Extracted text from file for ${doc.originalName}`);
                            } else {
                                throw new Error('No text extracted from file');
                            }
                        } catch (fileError) {
                            console.error(`Error extracting from file ${doc.originalName}:`, fileError);
                            throw new Error(`No extracted text available for ${doc.originalName}. Please re-upload the file.`);
                        }
                    } else {
                        throw new Error(`No extracted text or file path available for ${doc.originalName}`);
                    }
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Error getting text for ${doc.originalName}:`, error);
                return res.status(500).json({
                    error: `Failed to get text from ${doc.originalName}: ${errorMessage}`
                });
            }
        }

        if (extractedTexts.length === 0 || extractedTexts.every(t => !t || t.trim().length === 0)) {
            return res.status(400).json({ error: 'No text could be extracted from the uploaded files. Please check if the files are valid and contain readable text.' });
        }

        const fileNames = documents.map(d => d.originalName);
        const selectedLanguage = outputLanguage || 'english';

        // Detect chapter order and extract titles
        let chapterInfo: Array<{ order: number; title: string; content: string; fileIndex: number }> = [];

        if (extractedTexts.length > 1) {
            // Multiple files - each is a chapter
            chapterInfo = await detectChapterOrder(extractedTexts, fileNames);

            // Sort by order
            chapterInfo.sort((a, b) => a.order - b.order);

            // Update documents with chapter order
            for (const info of chapterInfo) {
                const doc = documents[info.fileIndex];
                if (doc) {
                    doc.chapterOrder = info.order;
                    doc.chapterTitle = info.title;
                    await doc.save();
                }
            }
        } else {
            // Single file - single chapter
            const chapterTitle = await extractChapterTitle(extractedTexts[0], fileNames[0], selectedLanguage);
            chapterInfo = [{
                order: 1,
                title: chapterTitle,
                content: extractedTexts[0].substring(0, 200),
                fileIndex: 0,
            }];
            documents[0].chapterOrder = 1;
            documents[0].chapterTitle = chapterTitle;
            await documents[0].save();
        }

        // Combine all text for overall material processing
        const combinedText = extractedTexts.filter(t => t && t.trim().length > 0).join('\n\n---\n\n');

        if (combinedText.length === 0) {
            return res.status(400).json({ error: 'No text content found in the uploaded files.' });
        }

        // Detect material name from file names and content
        let materialTitle = title;
        if (!materialTitle) {
            try {
                const textPreview = combinedText.substring(0, 1000);
                materialTitle = await detectMaterialName(fileNames, textPreview);
            } catch (error) {
                console.error('Error detecting material name:', error);
                materialTitle = `Study Material - ${new Date().toLocaleDateString()}`;
            }
        }

        // Process overall material with AI
        let overallResponse;
        try {
            overallResponse = await processStudyMaterial(combinedText, features, selectedLanguage);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error. Please check your GEMINI_API_KEY and try again.';
            console.error('Error processing with AI:', error);
            return res.status(500).json({
                error: `AI processing failed: ${errorMessage}`
            });
        }

        // Process each chapter separately in parallel for better performance
        const chapterPromises = chapterInfo.map(async (info) => {
            const chapterText = extractedTexts[info.fileIndex];
            if (!chapterText || chapterText.trim().length === 0) {
                return {
                    order: info.order,
                    title: info.title,
                    documentId: documents[info.fileIndex]._id,
                };
            }

            try {
                const chapterResponse = await processStudyMaterial(chapterText, features, selectedLanguage);
                return {
                    order: info.order,
                    title: info.title,
                    documentId: documents[info.fileIndex]._id,
                    summary: chapterResponse.summary,
                    keyPoints: chapterResponse.keyPoints,
                    formulas: chapterResponse.formulas,
                    examQuestions: chapterResponse.examQuestions,
                    mcqs: chapterResponse.mcqs,
                    flashcards: chapterResponse.flashcards,
                    youtubeVideos: chapterResponse.youtubeVideos,
                };
            } catch (error) {
                console.error(`Error processing chapter ${info.order} (${info.title}):`, error);
                // Return minimal chapter data if processing fails
                return {
                    order: info.order,
                    title: info.title,
                    documentId: documents[info.fileIndex]._id,
                };
            }
        });

        // Wait for all chapters to process in parallel
        const chapters = await Promise.all(chapterPromises);
        // Sort chapters by order
        chapters.sort((a, b) => a.order - b.order);

        // Create study material
        let studyMaterial;
        try {
            studyMaterial = await StudyMaterial.create({
                userId: new mongoose.Types.ObjectId(userId),
                documentIds: objectIds,
                title: materialTitle,
                summary: overallResponse.summary,
                keyPoints: overallResponse.keyPoints,
                formulas: overallResponse.formulas,
                examQuestions: overallResponse.examQuestions,
                mcqs: overallResponse.mcqs,
                flashcards: overallResponse.flashcards,
                studyPlan: overallResponse.studyPlan ? {
                    ...overallResponse.studyPlan,
                    schedule: overallResponse.studyPlan.schedule?.map((s: { date: string; topics: string[]; difficulty: string }) => ({
                        ...s,
                        date: new Date(s.date),
                    })) || [],
                } : undefined,
                outputLanguage: selectedLanguage,
                chapters: chapters,
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Database error';
            console.error('Error creating study material:', error);
            return res.status(500).json({
                error: `Failed to save study material: ${errorMessage}`
            });
        }

        // Mark documents as processed
        try {
            await Document.updateMany(
                { _id: { $in: objectIds } },
                { processed: true }
            );
        } catch (error) {
            console.error('Error updating document status:', error);
            // Don't fail the request if this fails
        }

        // Note: On Vercel, files in /tmp are automatically cleaned up
        // No need to manually delete files

        return res.status(200).json({
            message: 'Study material processed successfully',
            studyMaterial: {
                id: studyMaterial._id,
                title: studyMaterial.title,
                summary: studyMaterial.summary,
                keyPoints: studyMaterial.keyPoints,
                formulas: studyMaterial.formulas,
                examQuestions: studyMaterial.examQuestions,
                mcqs: studyMaterial.mcqs,
                flashcards: studyMaterial.flashcards,
                studyPlan: studyMaterial.studyPlan,
                chapters: studyMaterial.chapters,
                outputLanguage: studyMaterial.outputLanguage,
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Process error:', error);
        if (errorStack) {
            console.error('Error stack:', errorStack);
        }
        return res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? errorStack : undefined
        });
    }
}

