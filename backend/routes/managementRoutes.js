import express from 'express';
import { body } from 'express-validator';
import {
  getEmployeeById,
  editEmployee,
  getAllEmployees,
  getPendingPayrolls,
  addPayrollDetails,
  bulkUploadEmployees,
  getUpcomingEvents,
  sendUpcomingEventsEmail,
  requestSensitiveDetailsOtp,
  verifySensitiveDetailsOtp
} from '../controllers/managementController.js';
import { runAllChecks } from '../jobs/reminderJob.js';
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from '../config/constants.js';

const router = express.Router();

// @route   GET /api/employees/pending-payrolls
router.get('/pending-payrolls', getPendingPayrolls);

// @route   GET /api/employees/all
router.get('/all', getAllEmployees);

// @route   GET /api/employees/upcoming-events
router.get('/upcoming-events', getUpcomingEvents);

// @route   POST /api/employees/bulk-upload
router.post('/bulk-upload', bulkUploadEmployees);

// @route   POST /api/employees/trigger-reminders
router.post('/trigger-reminders', async (req, res) => {
  try {
    const events = await sendUpcomingEventsEmail();
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

// @route   POST /api/employees/payroll/:id
router.post('/payroll/:id', [
  body('ctc').isNumeric(),
  body('gross').isNumeric()
], addPayrollDetails);

// @route   POST /api/employees/:id/sensitive-otp
router.post('/:id/sensitive-otp', requestSensitiveDetailsOtp);

// @route   POST /api/employees/:id/sensitive-verify
router.post('/:id/sensitive-verify', [
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], verifySensitiveDetailsOtp);

// @route   GET /api/employees/:id
router.get('/:id', getEmployeeById);

// @route   PUT /api/employees/:id/edit
router.put('/:id/edit', editEmployee);

export default router;
