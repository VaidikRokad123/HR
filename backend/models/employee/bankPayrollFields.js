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
  bankNameBranch: { type: String, default: NA, trim: true },
  branch: { type: String, default: NA, trim: true },
  accountNumber: { type: String, default: NA, trim: true },
  ifscCode: { type: String, default: NA, trim: true },
  salaryAccountNumber: { type: String, default: NA, trim: true },
  salaryIfsc: { type: String, default: NA, trim: true },

  gross: { type: Number, default: null },
  ctc: { type: Number, default: null },
  pfApplicable: { type: Boolean, default: false },
  pfNumber: { type: String, default: NA, trim: true },
  uanNumber: { type: String, default: NA, trim: true },
  esicApplicable: { type: Boolean, default: false },
  esicNumber: { type: String, default: NA, trim: true },
  ptApplicable: { type: Boolean, default: false },
  ptNumber: { type: String, default: NA, trim: true },
  tdsApplicable: { type: Boolean, default: false },
  tdsRegime: { type: String, default: NA, trim: true },
  form12bb: { type: String, default: NA, trim: true },
  payrollHistory: { type: [payrollHistorySchema], default: [] },
};
