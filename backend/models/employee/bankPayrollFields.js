import { payrollHistorySchema, NA } from "./commonSchemas.js";

export const bankPayrollFields = {
  aadharNumber: { type: String, default: NA, trim: true },
  panNumber: { type: String, default: NA, trim: true },
  passportNumber: { type: String, default: NA, trim: true },
  drivingLicence: { type: String, default: NA, trim: true },
  voterIdNumber: { type: String, default: NA, trim: true },

  companyOpensBank: { type: Boolean, default: false },
  permissionToUsePanAadhar: { type: Boolean, default: false },
  accountHolderName: { type: String, default: NA, trim: true },
  bankName: { type: String, default: NA, trim: true },
  branch: { type: String, default: NA, trim: true },
  accountNumber: { type: String, default: NA, trim: true },
  ifscCode: { type: String, default: NA, trim: true },
  salaryAccountNumber: { type: String, default: NA, trim: true },
  salaryIfsc: { type: String, default: NA, trim: true },

  grossPerMonth: { type: Number, default: null },
  ctcPerYear: { type: Number, default: null },
  salaryPerMonth: { type: Number, default: null },
  pfApplicable: { type: Boolean, default: false },
  pfNumber: { type: String, default: NA, trim: true },
  uanNumber: { type: String, default: NA, trim: true },
  esicApplicable: { type: Boolean, default: false },
  esicNumber: { type: String, default: NA, trim: true },
  ptApplicable: { type: Boolean, default: false },
  tdsApplicable: { type: Boolean, default: false },
  tdsRegime: { type: String, default: NA, trim: true },
  tdsDocProof: { type: String, default: NA, trim: true },
  payrollHistory: { type: [payrollHistorySchema], default: [] },
};
