import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import StudyMaterial from '../../../../models/StudyMaterial';
import Document from '../../../../models/Document';
import User from '../../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectDB();

    const userId = session.user.id;
    
    // Convert userId to ObjectId for MongoDB query
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Use lean() for faster queries and add indexes hint
    const materials = await StudyMaterial.find({
      $or: [
        { userId: userObjectId },
        { sharedWith: userObjectId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean() // Faster queries, returns plain objects
      .limit(100); // Limit results for performance

    // Fetch document details separately to avoid populate issues
    const allDocumentIds = materials.flatMap((m) => m.documentIds || []);
    const documentsMap = new Map();
    if (allDocumentIds.length > 0) {
      const documents = await Document.find({
        _id: { $in: allDocumentIds },
      })
        .select('_id originalName fileType filePath')
        .lean(); // Faster queries
      documents.forEach((doc) => {
        documentsMap.set(String(doc._id), {
          id: String(doc._id),
          originalName: doc.originalName,
          fileType: doc.fileType,
          filePath: doc.filePath,
        });
      });
    }

    // Get user details for all materials
    const allUserIds = [...new Set(materials.map(m => m.userId.toString()))];
    const users = await User.find({ _id: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .select('name email')
      .lean();
    
    const usersMap = new Map(users.map((u: any) => [String(u._id), { name: u.name, email: u.email }]));

    // Set caching headers
    res.setHeader('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120');
    
    return res.status(200).json({
      materials: materials.map((m) => {
        const materialUserId = m.userId.toString();
        const isOwner = materialUserId === userId;
        const userInfo = usersMap.get(materialUserId) || null;
        
        return {
        id: String(m._id),
        title: m.title,
        userId: userInfo || materialUserId,
        isOwner: isOwner, // Add ownership flag
        documentIds: (m.documentIds || []).map((docId: any) => {
          const docIdStr = docId.toString ? docId.toString() : docId;
          return documentsMap.get(docIdStr) || { id: docIdStr };
        }),
        summary: m.summary,
        keyPoints: m.keyPoints,
        formulas: m.formulas,
        examQuestions: m.examQuestions,
        mcqs: m.mcqs,
        flashcards: m.flashcards,
        studyPlan: m.studyPlan,
        votes: m.votes,
        outputLanguage: m.outputLanguage || 'english',
        chapters: (m.chapters || []).map((chapter: any) => ({
          order: chapter.order,
          title: chapter.title,
          documentId: chapter.documentId?.toString() || chapter.documentId,
          summary: chapter.summary,
          keyPoints: chapter.keyPoints,
          formulas: chapter.formulas,
          examQuestions: chapter.examQuestions,
          mcqs: chapter.mcqs,
          flashcards: chapter.flashcards,
          youtubeVideos: chapter.youtubeVideos,
        })),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        };
      }),
    });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

