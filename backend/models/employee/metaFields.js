import mongoose from "mongoose";

export const metaFields = {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    sparse: true,
  },
  emp_code: { type: String, unique: true, sparse: true, trim: true },
  pendingSections: { type: [String], default: [] },
  completionPercentage: { type: Number, default: 0 },
};
