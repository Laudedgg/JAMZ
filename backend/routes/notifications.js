import express from 'express';
import Notification from '../models/notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      limit = 20,
      skip = 0,
      unreadOnly = 'false',
      type = null
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const notifications = await Notification.getUserNotifications(req.user._id, options);
    
    res.json({
      notifications,
      hasMore: notifications.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark specific notifications as read
router.patch('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ message: 'notificationIds array is required' });
    }

    await Notification.markAsRead(notificationIds, req.user._id);
    
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get notification by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('campaignId', 'title thumbnailImage');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark as read when viewed
    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADMIN ROUTES

// Create notification (admin only)
router.post('/admin/create', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      userId,
      type,
      title,
      message,
      campaignId,
      submissionId,
      priority = 'medium',
      data = {},
      expiresAt
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        message: 'userId, type, title, and message are required' 
      });
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      campaignId,
      submissionId,
      priority,
      data,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await notification.save();
    await notification.populate('campaignId', 'title thumbnailImage');

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// Broadcast notification to multiple users (admin only)
router.post('/admin/broadcast', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      userIds,
      type,
      title,
      message,
      campaignId,
      priority = 'medium',
      data = {},
      expiresAt
    } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    if (!type || !title || !message) {
      return res.status(400).json({ 
        message: 'type, title, and message are required' 
      });
    }

    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      campaignId,
      priority,
      data,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      message: `${createdNotifications.length} notifications created`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get notification statistics (admin only)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalNotifications = await Notification.countDocuments();
    const totalUnread = await Notification.countDocuments({ isRead: false });

    res.json({
      totalNotifications,
      totalUnread,
      byType: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
