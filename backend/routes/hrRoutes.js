import express from 'express';
import { body } from 'express-validator';
import {
  getPendingEmployees,
  getEmployeeById,
  approveEmployee,
  rejectEmployee,
  editEmployee,
  getAllEmployees,
  getPendingPayrolls,
  addPayrollDetails,
  bulkUploadEmployees
} from '../controllers/hrController.js';
import { auth, hrOnly, hrSeniorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/hr/pending-employees
// @desc    Get all pending employee registrations
// @access  Private (HR)
router.get('/pending-employees', auth, hrOnly, getPendingEmployees);

// @route   GET /api/hr/pending-payrolls
// @desc    Get all pending payroll details
// @access  Private (HR)
router.get('/pending-payrolls', auth, hrOnly, getPendingPayrolls);

// @route   POST /api/hr/payroll/:id
// @desc    Add payroll details for employee
// @access  Private (Senior HR Only)
router.post('/payroll/:id', [
  auth,
  hrSeniorOnly,
  body('ctc').isNumeric(),
  body('gross').isNumeric()
], addPayrollDetails);

// @route   GET /api/hr/employee/:id
// @desc    Get full employee details
// @access  Private (HR)
router.get('/employee/:id', auth, hrOnly, getEmployeeById);

// @route   PUT /api/hr/employee/:id/approve
// @desc    Approve employee and assign professional details
// @access  Private (Senior HR Only)
router.put('/employee/:id/approve', [
  auth,
  hrSeniorOnly,
  body('dateJoined').isISO8601(),
  body('department').notEmpty(),
  body('jobTitle').notEmpty(),
  body('employmentType').notEmpty(),
  body('workEmail').isEmail(),
  body('probationDuration')
    .optional({ checkFalsy: true })
    .isNumeric().withMessage('Probation duration must be a number.')
    .isInt({ min: 0, max: 12 }).withMessage('Probation duration must be between 0 and 12 months.')
], approveEmployee);

// @route   PUT /api/hr/employee/:id/reject
// @desc    Reject employee registration
// @access  Private (Senior HR Only)
router.put('/employee/:id/reject', auth, hrSeniorOnly, rejectEmployee);

// @route   PUT /api/hr/employee/:id/edit
// @desc    Edit employee details (any module)
// @access  Private (Senior HR Only)
router.put('/employee/:id/edit', auth, hrSeniorOnly, editEmployee);

// @route   GET /api/hr/all-employees
// @desc    Get all approved employees
// @access  Private (HR)
router.get('/all-employees', auth, hrOnly, getAllEmployees);

// @route   POST /api/hr/bulk-upload
// @desc    Bulk upload employees from excel data
// @access  Private (Senior HR Only)
router.post('/bulk-upload', auth, hrSeniorOnly, bulkUploadEmployees);

export default router;
