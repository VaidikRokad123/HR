import mongoose from "mongoose";

export const NA = "not set yet";

export const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: NA, trim: true },
    city: { type: String, default: NA, trim: true },
    state: { type: String, default: NA, trim: true },
    pincode: { type: String, default: NA, trim: true },
    country: { type: String, default: "India", trim: true },
  },
  { _id: false },
);

export const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: NA, trim: true },
    phone: { type: String, default: NA, trim: true },
    relationship: { type: String, default: NA, trim: true },
  },
  { _id: false },
);

export const referenceSchema = new mongoose.Schema(
  {
    name: { type: String, default: NA, trim: true },
    phone: { type: String, default: NA, trim: true },
    email: { type: String, default: NA, lowercase: true, trim: true },
  },
  { _id: false },
);

export const payrollHistorySchema = new mongoose.Schema(
  {
    ctcPerYear: Number,
    grossPerMonth: Number,
    salaryPerMonth: Number,
    pf: Boolean,
    esic: Boolean,
    tds: Boolean,
    updatedAt: { type: Date, default: Date.now },
    changeType: { type: String, default: "update" },
  },
  { _id: false },
);
