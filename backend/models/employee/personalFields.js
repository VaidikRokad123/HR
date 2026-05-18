import { NA } from "./commonSchemas.js";

export const personalFields = {
  fullName: { type: String, default: NA, trim: true },
  dob: { type: Date, default: null },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other", NA], default: NA },
  maritalStatus: {
    type: String,
    enum: ["Single", "Married", "Divorced", "Engaged", NA],
    default: NA,
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
