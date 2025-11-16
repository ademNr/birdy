import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import StudyMaterial from '../../../../models/StudyMaterial';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { materialId, vote } = req.body;

    if (!materialId || !vote) {
      return res.status(400).json({ error: 'Material ID and vote are required' });
    }

    if (vote !== 'up' && vote !== 'down') {
      return res.status(400).json({ error: 'Vote must be "up" or "down"' });
    }

    await connectDB();

    const userId = session.user.id;

    // Find material
    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Remove existing vote from this user
    material.votes = material.votes.filter(
      (v) => v.userId.toString() !== userId
    );

    // Add new vote
    material.votes.push({
      userId: userId as any,
      vote,
    });

    await material.save();

    const upVotes = material.votes.filter((v) => v.vote === 'up').length;
    const downVotes = material.votes.filter((v) => v.vote === 'down').length;

    return res.status(200).json({
      message: 'Vote recorded',
      votes: {
        up: upVotes,
        down: downVotes,
        total: material.votes.length,
      },
    });
  } catch (error: any) {
    console.error('Vote error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

