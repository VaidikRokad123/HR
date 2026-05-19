import {
  DEPARTMENTS,
  DESIGNATIONS,
  EMPLOYMENT_TYPES,
} from "../../config/constants.js";
import { NA } from "./commonSchemas.js";

export const WORK_LOCATIONS = ["Office", "Remote", "Hybrid"];

export const professionalFields = {
  dateJoining: { type: Date, default: null },
  exitDate: { type: Date, default: null },
  employmentType: {
    type: String,
    enum: [
      ...EMPLOYMENT_TYPES,
      "Full-Time",
      "Contract",
      "Intern",
      "Notice-Period",
      NA,
    ],
    default: NA,
  },
  probationMonths: { type: Number, default: 0 },
  confirmationDate: { type: Date, default: null },
  workLocation: { type: String, enum: [...WORK_LOCATIONS, NA], default: NA },
  designation: { type: String, enum: [...DESIGNATIONS, NA], default: NA },
  department: { type: String, enum: [...DEPARTMENTS, NA], default: NA },
  reportingManager: { type: String, default: NA, trim: true },
  officialEmail: { type: String, default: NA, lowercase: true, trim: true },
  workMobile: { type: String, default: NA, trim: true },
  laptopAssigned: { type: String, default: NA, trim: true },
  linkedinUrl: { type: String, default: NA, trim: true },
  attendanceBiometricId: { type: String, default: NA, trim: true },
  nameAsPerAadhaar: { type: String, default: NA, trim: true },
  inProbation: { type: Boolean, default: true },
  probationEndedNotified: { type: Boolean, default: false },
};
