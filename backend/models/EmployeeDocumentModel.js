import mongoose from 'mongoose';

const employeeDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emp_code: { type: String, required: true },
  category: { type: String, enum: ['personal_identity', 'onboarding', 'offboarding'], required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('EmployeeDocument', employeeDocumentSchema);
