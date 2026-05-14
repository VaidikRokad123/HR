import mongoose from 'mongoose';

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
    trim: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
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
