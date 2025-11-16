import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import StudyMaterial from '../../../../models/StudyMaterial';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { materialId, email, emails } = req.body;

    // Support both single email and multiple emails
    const emailsToShare = emails || (email ? [email] : []);
    
    if (!materialId || emailsToShare.length === 0) {
      return res.status(400).json({ error: 'Material ID and at least one email are required' });
    }

    await connectDB();

    const userId = session.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find material
    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Study material not found' });
    }

    // Check if user owns the material
    const materialOwnerId = material.userId.toString();
    if (materialOwnerId !== userId) {
      return res.status(403).json({ error: 'You can only share materials you own' });
    }

    // Get sharer info for notifications
    const sharer = await User.findById(userObjectId);
    const sharerName = sharer?.name || sharer?.email || 'Someone';

    const results = {
      shared: [] as string[],
      alreadyShared: [] as string[],
      notFound: [] as string[],
      errors: [] as string[],
    };

    // Process each email
    for (const emailToProcess of emailsToShare) {
      try {
        const normalizedEmail = emailToProcess.toLowerCase().trim();
        
        // Find user to share with
        const userToShare = await User.findOne({ email: normalizedEmail });
        if (!userToShare) {
          results.notFound.push(normalizedEmail);
          continue;
        }

        // Don't allow sharing with yourself
        if (String(userToShare._id) === userId) {
          results.errors.push(`${normalizedEmail} (cannot share with yourself)`);
          continue;
        }

        // Check if already shared
        const userToShareId = userToShare._id as mongoose.Types.ObjectId;
        const userToShareIdStr = String(userToShareId);
        const isAlreadyShared = material.sharedWith.some((id: any) => String(id) === userToShareIdStr);
        
        if (isAlreadyShared) {
          results.alreadyShared.push(normalizedEmail);
          continue;
        }

        // Add to sharedWith array
        material.sharedWith.push(userToShareId);
        results.shared.push(normalizedEmail);

        // Create notification for the user being shared with
        await Notification.create({
          userId: userToShareId,
          type: 'material_shared',
          materialId: material._id,
          sharedBy: userObjectId,
          message: `${sharerName} shared "${material.title}" with you`,
        });
      } catch (error: any) {
        console.error(`Error sharing with ${emailToProcess}:`, error);
        results.errors.push(`${emailToProcess} (${error.message})`);
      }
    }

    // Save material if any new shares were added
    if (results.shared.length > 0) {
      await material.save();
    }

    // Build response message
    const messages = [];
    if (results.shared.length > 0) {
      messages.push(`Successfully shared with ${results.shared.length} user${results.shared.length > 1 ? 's' : ''}`);
    }
    if (results.alreadyShared.length > 0) {
      messages.push(`${results.alreadyShared.length} user${results.alreadyShared.length > 1 ? 's' : ''} already had access`);
    }
    if (results.notFound.length > 0) {
      messages.push(`${results.notFound.length} user${results.notFound.length > 1 ? 's' : ''} not found`);
    }
    if (results.errors.length > 0) {
      messages.push(`${results.errors.length} error${results.errors.length > 1 ? 's' : ''}`);
    }

    return res.status(200).json({
      message: messages.join('. '),
      results: {
        shared: results.shared.length,
        alreadyShared: results.alreadyShared.length,
        notFound: results.notFound.length,
        errors: results.errors.length,
      },
    });
  } catch (error: any) {
    console.error('Share error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

