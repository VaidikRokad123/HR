import mongoose from 'mongoose';

const employeeFamilySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  motherName: {
    type: String,
    required: true,
    trim: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'],
    default: 'Single'
  },
  spouseName: {
    type: String,
    trim: true
  },
  marriageDate: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('EmployeeFamily', employeeFamilySchema);
