import mongoose from 'mongoose';

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
    enum: ['employee', 'hr'],
    default: 'employee'
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
