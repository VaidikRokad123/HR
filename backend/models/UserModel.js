import mongoose from 'mongoose';
import { ROLES } from '../config/rbac.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.EMPLOYEE
  },
  emp_code: {
    type: String,
    unique: true,
    sparse: true
    // Don't set default - let it be undefined
  },
  status: {
    type: String,
    enum: ['pending_hr', 'approved', 'rejected'],
    default: 'pending_hr'
  },
  resetPasswordOtp: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
