import NotificationModel from '../models/NotificationModel.js';

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'hr') {
      // HR sees all HR notifications
      query = { toRole: 'hr' };
    } else {
      // Employee sees their own notifications
      query = {
        $or: [
          { toUserId: req.user.userId },
          { toEmpCode: req.user.emp_code }
        ]
      };
    }

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await NotificationModel.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    let query = { isRead: false };

    if (req.user.role === 'hr') {
      query.toRole = 'hr';
    } else {
      query.$or = [
        { toUserId: req.user.userId },
        { toEmpCode: req.user.emp_code }
      ];
    }

    const count = await NotificationModel.countDocuments(query);

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
