import mongoose from 'mongoose';

const employeeBankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String,
    required: true
  },
  companyOpensBank: {
    type: Boolean,
    default: false
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  aadharNumber: {
    type: String,
    trim: true
  },
  permissionToUsePanAadhar: {
    type: Boolean,
    default: false
  },
  bankName: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  personalAccountNumber: {
    type: String,
    trim: true
  },
  personalIfsc: {
    type: String,
    uppercase: true,
    trim: true
  },
  salaryAccountNumber: {
    type: String,
    trim: true
  },
  salaryIfsc: {
    type: String,
    uppercase: true,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('EmployeeBank', employeeBankSchema);
