import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  toRole: {
    type: String,
    enum: ['hr', 'employee'],
    required: true
  },
  toEmpCode: {
    type: String,
    default: null
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', notificationSchema);
