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
  },
  history: [{
    ctc: Number,
    gross: Number,
    pf: Boolean,
    pt: Boolean,
    esic: Boolean,
    tds: Boolean,
    updatedAt: { type: Date, default: Date.now },
    changeType: { type: String, default: 'update' } // e.g. 'initial', 'update'
  }]
}, { timestamps: true });

export default mongoose.model('EmployeePayroll', employeePayrollSchema);
