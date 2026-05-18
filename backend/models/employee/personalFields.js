import { NA } from "./commonSchemas.js";

export const personalFields = {
  fullName: { type: String, required: true, trim: true },
  dob: { type: Date, required: true },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  maritalStatus: {
    type: String,
    enum: ["Single", "Married", "Divorced", "Engaged", NA],
    required: true,
  },
  religion: { type: String, default: NA, trim: true },
  physicallyHandicapped: {
    type: String,
    enum: ["Yes", "No", NA],
    default: NA,
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", NA],
    default: NA,
  },
};
