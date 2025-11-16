import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import Document from '../../../../models/Document';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { documentIds } = req.query;

    if (!documentIds || typeof documentIds !== 'string') {
      return res.status(400).json({ error: 'Document IDs are required' });
    }

    await connectDB();

    const userId = session.user.id;
    const ids = documentIds.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));

    const documents = await Document.find({
      _id: { $in: ids },
      userId: new mongoose.Types.ObjectId(userId),
    }).select('_id originalName fileType extractedText processed');

    const documentsData = documents.map((doc) => ({
      id: String(doc._id),
      originalName: doc.originalName,
      fileType: doc.fileType,
      extractedText: doc.extractedText || '',
      processed: doc.processed || false,
    }));

    return res.status(200).json({
      documents: documentsData,
    });
  } catch (error: any) {
    console.error('Error fetching document status:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

