import mongoose from 'mongoose';

const employeePayrollSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emp_code: {
    type: String,
    required: true,
    unique: true
  },
  ctc: {
    type: Number,
    required: true
  },
  gross: {
    type: Number,
    required: true
  },
  pf: {
    type: Boolean,
    default: false
  },
  pt: {
    type: Boolean,
    default: false
  },
  esic: {
    type: Boolean,
    default: false
  },
  tds: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('EmployeePayroll', employeePayrollSchema);
