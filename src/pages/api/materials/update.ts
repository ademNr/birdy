import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import StudyMaterial from '../../../../models/StudyMaterial';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { materialId, title } = req.body;

    if (!materialId || !title) {
      return res.status(400).json({ error: 'Material ID and title are required' });
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title cannot be empty' });
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
      return res.status(404).json({ error: 'Study material not found or unauthorized' });
    }

    // Update title
    material.title = title.trim();
    await material.save();

    return res.status(200).json({
      message: 'Material title updated successfully',
      material: {
        id: String(material._id),
        title: material.title,
      },
    });
  } catch (error: any) {
    console.error('Error updating material:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

