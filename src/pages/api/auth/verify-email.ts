// This endpoint is no longer used but kept for backward compatibility
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.redirect(302, '/auth/signin');
}

