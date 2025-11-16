import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import Document from '../../../../models/Document';
import StudyMaterial from '../../../../models/StudyMaterial';

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
    const { materialId } = req.query;

    if (!materialId) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    // Verify user owns or has access to this material
    const material = await StudyMaterial.findOne({
      _id: new mongoose.Types.ObjectId(materialId as string),
      $or: [
        { userId: new mongoose.Types.ObjectId(userId) },
        { sharedWith: new mongoose.Types.ObjectId(userId) },
      ],
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Fetch all documents for this material
    const documents = await Document.find({
      _id: { $in: material.documentIds },
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ chapterOrder: 1 });

    const documentsData = documents.map((doc) => ({
      id: doc._id,
      originalName: doc.originalName,
      fileType: doc.fileType,
      chapterOrder: doc.chapterOrder,
      chapterTitle: doc.chapterTitle,
      extractedText: doc.extractedText || '',
      createdAt: doc.createdAt,
    }));

    return res.status(200).json({
      documents: documentsData,
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

