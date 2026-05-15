import mongoose from 'mongoose';
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from '../config/rbac.js';

const employeeProfessionalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String,
    required: true,
    unique: true
  },
  nameAsPerAadhaar: {
    type: String,
    trim: true
  },
  dateJoined: {
    type: Date,
    required: true
  },
  tenure: {
    type: String
  },
  exitDate: {
    type: Date
  },
  department: {
    type: String,
    required: true,
    trim: true,
    enum: DEPARTMENTS
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
    enum: DESIGNATIONS
  },
  employmentType: {
    type: String,
    trim: true,
    enum: EMPLOYMENT_TYPES
  },
  reportingManager: {
    type: String,
    trim: true
  },
  attendanceBiometricId: {
    type: String,
    trim: true
  },
  inProbation: {
    type: Boolean,
    default: true
  },
  probationDuration: {
    type: Number
  },
  probationEndedNotified: {
    type: Boolean,
    default: false
  },
  workEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('EmployeeProfessional', employeeProfessionalSchema);
