import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import Notification from '../../../../models/Notification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await connectDB();

      const userId = session.user.id;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const notifications = await Notification.find({
        userId: userObjectId,
      })
        .populate('sharedBy', 'name email')
        .populate('materialId', 'title')
        .sort({ createdAt: -1 })
        .limit(50);

      return res.status(200).json({
        notifications: notifications.map((notif) => ({
          id: String(notif._id),
          type: notif.type,
          materialId: notif.materialId?._id?.toString() || notif.materialId?.toString(),
          materialTitle: (notif.materialId as any)?.title || 'Unknown Material',
          sharedBy: notif.sharedBy ? {
            id: (notif.sharedBy as any)._id?.toString() || (notif.sharedBy as any).toString(),
            name: (notif.sharedBy as any).name || (notif.sharedBy as any).email || 'Unknown',
            email: (notif.sharedBy as any).email || '',
          } : null,
          message: notif.message,
          read: notif.read,
          createdAt: notif.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    // Mark notification as read
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      await connectDB();

      const userId = session.user.id;
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const notificationObjectId = new mongoose.Types.ObjectId(notificationId);

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationObjectId,
          userId: userObjectId,
        },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

