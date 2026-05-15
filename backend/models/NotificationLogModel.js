import mongoose from 'mongoose';

// Deduplication guard — prevents sending the same alert twice in the same year.
// One record per employee, per event type, per calendar year.
const notificationLogSchema = new mongoose.Schema({
  emp_code: { type: String, required: true },
  type:     { type: String, required: true },  // 'birthday' | 'probation' | 'anniversary' | 'profile_incomplete' | 'payroll_pending'
  year:     { type: Number, required: true },  // current calendar year
  sentAt:   { type: Date,   default: Date.now },
  meta:     { type: Object }                   // optional extra data
});

// Compound unique index — one log per employee per type per year
notificationLogSchema.index({ emp_code: 1, type: 1, year: 1 }, { unique: true });

export default mongoose.model('NotificationLog', notificationLogSchema);
