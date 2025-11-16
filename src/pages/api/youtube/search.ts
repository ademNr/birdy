import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { searchYouTubeVideos } from '../../../../lib/youtube';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { searchQuery, maxResults } = req.body;

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.status(400).json({ error: 'searchQuery is required' });
    }

    const videos = await searchYouTubeVideos(
      searchQuery,
      maxResults || 5
    );

    return res.status(200).json({ videos });
  } catch (error) {
    console.error('Error in YouTube search API:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to search YouTube videos'
    });
  }
}

