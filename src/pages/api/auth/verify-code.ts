import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import PendingRegistration from '../../../../models/PendingRegistration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    await connectDB();

    // Find pending registration
    const pendingRegistration = await PendingRegistration.findOne({
      email: email.toLowerCase(),
      verificationCode: code,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!pendingRegistration) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check if user already exists (race condition check)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Clean up pending registration
      await PendingRegistration.deleteOne({ _id: pendingRegistration._id });
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user account
    const user = await User.create({
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      name: pendingRegistration.name,
      emailVerified: true, // Already verified via code
    });

    // Clean up pending registration
    await PendingRegistration.deleteOne({ _id: pendingRegistration._id });

    return res.status(201).json({
      message: 'Account created successfully! You can now sign in.',
      userId: user._id,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

