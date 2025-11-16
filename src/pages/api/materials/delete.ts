import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import StudyMaterial from '../../../../models/StudyMaterial';
import Document from '../../../../models/Document';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    await connectDB();

    const userId = session.user.id;
    const materialObjectId = new mongoose.Types.ObjectId(materialId);

    // Find material and verify ownership
    const material = await StudyMaterial.findOne({
      _id: materialObjectId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!material) {
      return res.status(404).json({ error: 'Study material not found or you do not have permission to delete it' });
    }

    // Delete associated documents
    if (material.documentIds && material.documentIds.length > 0) {
      await Document.deleteMany({
        _id: { $in: material.documentIds },
      });
    }

    // Delete the material
    await StudyMaterial.deleteOne({ _id: materialObjectId });

    return res.status(200).json({
      message: 'Material deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

