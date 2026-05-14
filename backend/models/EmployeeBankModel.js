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
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  personalAccountNumber: {
    type: String,
    required: true,
    trim: true
  },
  personalIfsc: {
    type: String,
    required: true,
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
