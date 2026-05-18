import express from "express";
import {
  getRefData,
  getNextEmpCode,
  saveDraft,
  getDraft,
  deleteDraft,
  createEmployee,
  updateEmployee,
} from "../controllers/adminController.js";
import { getEmployeeById } from "../controllers/managementController.js";

const router = express.Router();

// @route   GET /api/admin/ref
router.get("/ref", getRefData);

// @route   GET /api/admin/next-emp-code
router.get("/next-emp-code", getNextEmpCode);

// @route   POST /api/admin/drafts
router.post("/drafts", saveDraft);

// @route   GET /api/admin/drafts/:id
router.get("/drafts/:id", getDraft);

// @route   DELETE /api/admin/drafts/:id
router.delete("/drafts/:id", deleteDraft);

// @route   POST /api/admin/employees
router.post("/employees", createEmployee);

// @route   GET /api/admin/employees/:id  (edit mode prefill)
router.get("/employees/:id", getEmployeeById);

// @route   PUT /api/admin/employees/:id  (edit mode save)
router.put("/employees/:id", updateEmployee);

export default router;
