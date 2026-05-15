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
  bulkUploadEmployees,
  getUpcomingEvents,
  sendUpcomingEventsEmailToHr
} from '../controllers/hrController.js';
import { auth, hrOnly, hrSeniorOnly, requirePermission } from '../middleware/authMiddleware.js';
import { runAllChecks } from '../jobs/reminderJob.js';
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES, PERMISSIONS } from '../config/rbac.js';

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
  body('department').isIn(DEPARTMENTS).withMessage('Invalid department'),
  body('jobTitle').isIn(DESIGNATIONS).withMessage('Invalid designation'),
  body('employmentType').isIn(EMPLOYMENT_TYPES).withMessage('Invalid employment type'),
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

// @route   GET /api/hr/upcoming-events
// @desc    Get all upcoming employee events grouped by type
// @access  Private (HR)
router.get('/upcoming-events', auth, hrOnly, getUpcomingEvents);

// @route   POST /api/hr/bulk-upload
// @desc    Bulk upload employees from excel data
// @access  Private (Senior HR Only)
router.post('/bulk-upload', auth, hrSeniorOnly, bulkUploadEmployees);

// @route   POST /api/hr/trigger-reminders
// @desc    Manually trigger all reminder checks (for testing or on-demand runs)
// @access  Private (HR only)
router.post('/trigger-reminders', auth, requirePermission(PERMISSIONS.HR_TRIGGER_REMINDERS), async (req, res) => {
  try {
    const events = await sendUpcomingEventsEmailToHr();
    try {
      await runAllChecks();
    } catch (reminderErr) {
      console.error('[TriggerReminders] RabbitMQ reminder checks failed:', reminderErr.message);
    }
    res.json({
      success: true,
      message: `Upcoming events summary email sent to ${process.env.HR_EMAIL}`,
      events
    });
  } catch (err) {
    console.error('[TriggerReminders] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
