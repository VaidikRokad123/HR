import { payrollHistorySchema, NA } from "./commonSchemas.js";

export const bankPayrollFields = {
  aadharNumber: { type: String, required: true, trim: true },
  panNumber: { type: String, required: true, trim: true },
  passportNumber: { type: String, default: NA, trim: true },
  drivingLicence: { type: String, default: NA, trim: true },
  voterIdNumber: { type: String, default: NA, trim: true },

  companyOpensBank: { type: Boolean, default: false },
  permissionToUsePanAadhar: { type: Boolean, default: false },
  accountHolderName: { type: String, trim: true },
  bankNameBranch: { type: String, trim: true },
  branch: { type: String, trim: true },
  accountNumber: { type: String, trim: true },
  ifscCode: { type: String, trim: true },
  salaryAccountNumber: { type: String, trim: true },
  salaryIfsc: { type: String, trim: true },

  gross: { type: Number },
  ctc: { type: Number },
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
