import mongoose from 'mongoose';

const employeeEmergencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String
  },
  emergencyContact1: {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    mobile: { type: String, required: true }
  },
  emergencyContact2: {
    name: { type: String },
    relationship: { type: String },
    mobile: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('EmployeeEmergency', employeeEmergencySchema);
