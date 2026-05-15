import NotificationModel from '../models/NotificationModel.js';
import { ROLES } from '../config/rbac.js';

const notificationScopeForUser = (user) => {
  if (user.role === ROLES.HR) {
    return {
      $or: [
        { toRole: ROLES.HR },
        { toRole: 'all' },
        { toUserId: user.userId }
      ]
    };
  }

  const orConditions = [{ toUserId: user.userId }];
  if (user.emp_code) {
    orConditions.push({ toEmpCode: user.emp_code });
  }
  return { $or: orConditions };
};

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const query = notificationScopeForUser(req.user);

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
    const notification = await NotificationModel.findOne({
      _id: req.params.id,
      ...notificationScopeForUser(req.user)
    });
    
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
    const query = {
      isRead: false,
      ...notificationScopeForUser(req.user)
    };

    const count = await NotificationModel.countDocuments(query);

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
