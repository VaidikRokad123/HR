import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Employee signup (multi-step final submit)
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage('A valid login email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('personal.fullName').notEmpty().withMessage('Full name is required'),
  body('personal.gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender is required'),
  body('personal.dob').isISO8601().withMessage('Valid date of birth is required'),
  body('personal.mobile').notEmpty().withMessage('Mobile number is required'),
  body('personal.bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Blood group is required'),
  body('family.fatherName').notEmpty().withMessage("Father's name is required"),
  body('family.motherName').notEmpty().withMessage("Mother's name is required"),
  body('address.currentAddress').notEmpty().withMessage('Current address is required'),
  body('address.permanentAddress').notEmpty().withMessage('Permanent address is required'),
  body('emergency.emergencyContact1').notEmpty().withMessage('Primary emergency contact is required')
], register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, logout);

export default router;
