import express from 'express';
import { getNotifications, markAsRead, getUnreadCount } from '../controllers/notificationController.js';

const router = express.Router();

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Public
router.get('/unread-count', getUnreadCount);

// @route   GET /api/notifications
// @desc    Get notifications
// @access  Public
router.get('/', getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Public
router.put('/:id/read', markAsRead);

export default router;
