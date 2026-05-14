import express from 'express';
import { getNotifications, markAsRead, getUnreadCount } from '../controllers/notificationController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, getUnreadCount);

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', auth, getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, markAsRead);

export default router;
