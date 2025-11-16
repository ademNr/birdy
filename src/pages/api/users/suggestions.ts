import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
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

    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    await connectDB();

    const userId = session.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const searchQuery = query.toLowerCase().trim();

    // Find users whose email contains the query (excluding current user)
    const users = await User.find({
      email: { $regex: searchQuery, $options: 'i' },
      _id: { $ne: userObjectId },
    })
      .select('email name')
      .limit(10)
      .sort({ email: 1 });

    const suggestions = users.map((user) => ({
      email: user.email,
      name: user.name || user.email.split('@')[0],
    }));

    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('Error fetching user suggestions:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

