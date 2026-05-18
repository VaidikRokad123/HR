import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  emp_code: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: String,
    enum: ["approved"],
    default: "approved",
  },
  pendingSections: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
