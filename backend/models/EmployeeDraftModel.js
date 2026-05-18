import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
  draftId:     { type: String, required: true, unique: true },
  formData:    { type: mongoose.Schema.Types.Mixed },
  currentStep: { type: Number, default: 0 },
  updatedAt:   { type: Date, default: Date.now }
});

// Auto-expire drafts after 7 days
draftSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('EmployeeDraft', draftSchema);
