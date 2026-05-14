import express from 'express';
import { body } from 'express-validator';
import { getWaitingStatus, getMyDetails, completeProfile } from '../controllers/employeeController.js';
import { auth, employeeOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Custom LinkedIn URL validator
const linkedinUrlValidator = body('linkedinUrl')
  .isURL().withMessage('Must be a valid URL')
  .custom((value) => {
    try {
      const url = new URL(value);
      if (!url.hostname.includes('linkedin.com')) {
        throw new Error('Must be a LinkedIn URL');
      }
      if (!url.pathname.includes('/in/')) {
        throw new Error('Must be a LinkedIn profile URL (should contain /in/)');
      }
      return true;
    } catch (error) {
      throw new Error(error.message || 'Invalid LinkedIn URL format');
    }
  });

// @route   GET /api/employee/waiting-status
// @desc    Check approval status
// @access  Private (Employee)
router.get('/waiting-status', auth, employeeOnly, getWaitingStatus);

// @route   GET /api/employee/my-details
// @desc    Get employee's own profile
// @access  Private (Employee)
router.get('/my-details', auth, employeeOnly, getMyDetails);

// @route   PUT /api/employee/complete-profile
// @desc    Complete profile with bank details and LinkedIn URL (mandatory)
// @access  Private (Employee)
router.put('/complete-profile', [
  auth,
  employeeOnly,
  body('bankName').notEmpty().withMessage('Bank name is required'),
  body('branch').notEmpty().withMessage('Branch is required'),
  body('personalAccountNumber').notEmpty().withMessage('Personal account number is required'),
  body('personalIfsc')
    .notEmpty().withMessage('Personal IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format (e.g., SBIN0001234)'),
  linkedinUrlValidator
], completeProfile);

export default router;
