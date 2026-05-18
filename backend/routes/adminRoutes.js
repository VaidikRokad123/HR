import express from 'express';
import {
  getRefData,
  getNextEmpCode,
  saveDraft,
  getDraft,
  deleteDraft,
  createEmployee
} from '../controllers/adminController.js';
import { auth, hrOnly, hrSeniorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/admin/ref
// @desc    Get reference data for forms
router.get('/ref', auth, hrOnly, getRefData);

// @route   GET /api/admin/next-emp-code
// @desc    Get next employee code
router.get('/next-emp-code', auth, hrOnly, getNextEmpCode);

// @route   POST /api/admin/drafts
// @desc    Save form draft
router.post('/drafts', auth, hrOnly, saveDraft);

// @route   GET /api/admin/drafts/:id
// @desc    Get draft by ID
router.get('/drafts/:id', auth, hrOnly, getDraft);

// @route   DELETE /api/admin/drafts/:id
// @desc    Delete a draft
router.delete('/drafts/:id', auth, hrOnly, deleteDraft);

// @route   POST /api/admin/employees
// @desc    Create new employee from AddEmployee form
router.post('/employees', auth, hrOnly, createEmployee);

// (Future implementation for PUT /api/admin/employees/:id could go here)

export default router;
