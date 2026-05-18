import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from "../../config/constants.js";
import { NA } from "./commonSchemas.js";

export const WORK_LOCATIONS = ["Office", "Remote", "Hybrid"];

export const professionalFields = {
  dateJoining: { type: Date },
  exitDate: { type: Date },
  employmentType: { type: String, enum: [...EMPLOYMENT_TYPES, "Full-Time", "Contract", "Intern", "Notice-Period", NA] },
  probationMonths: { type: Number, default: 0 },
  confirmationDate: { type: Date },
  workLocation: { type: String, enum: [...WORK_LOCATIONS, NA] },
  designation: { type: String, enum: DESIGNATIONS },
  department: { type: String, enum: DEPARTMENTS },
  reportingManager: { type: String, default: NA, trim: true },
  officialEmail: { type: String, lowercase: true, trim: true },
  workMobile: { type: String, default: NA, trim: true },
  laptopAssigned: { type: String, default: NA, trim: true },
  linkedinUrl: { type: String, default: NA, trim: true },
  inProbation: { type: Boolean, default: true },
  probationEndedNotified: { type: Boolean, default: false },
};
