import mongoose from "mongoose";
import { personalFields } from "./employee/personalFields.js";
import { contactFields } from "./employee/contactFields.js";
import { educationFields } from "./employee/educationFields.js";
import { familyFields } from "./employee/familyFields.js";
import { professionalFields } from "./employee/professionalFields.js";
import { bankPayrollFields } from "./employee/bankPayrollFields.js";
import { metaFields } from "./employee/metaFields.js";
import { NA } from "./employee/commonSchemas.js";

const employeeSchema = new mongoose.Schema(
  {
    ...metaFields,

    /* Personal */
    ...personalFields,

    /* Contact */
    ...contactFields,

    /* Government IDs, bank and payroll */
    ...bankPayrollFields,

    /* Education */
    ...educationFields,

    /* Family */
    ...familyFields,

    /* Professional */
    ...professionalFields,
  },
  { timestamps: true },
);

employeeSchema.index({ userId: 1 }, { unique: true, sparse: true });
employeeSchema.index({ emp_code: 1 }, { unique: true, sparse: true });

employeeSchema.pre("save", function (next) {
  applyDerivedFields(this);
  next();
});

employeeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  const set = update.$set || update;

  if (set.sameAsCurrent && set.currentAddress) {
    set.permanentAddress = { ...set.currentAddress };
  }

  if (set.dob) {
    set.age = calculateAge(set.dob);
  }

  if (update.$set) update.$set = set;
  else this.setUpdate(set);

  next();
});

function applyDerivedFields(employee) {
  if (employee.dob) {
    employee.age = calculateAge(employee.dob);
  }

  if (employee.sameAsCurrent && employee.currentAddress) {
    const currentAddress = employee.currentAddress.toObject
      ? employee.currentAddress.toObject()
      : employee.currentAddress;
    employee.permanentAddress = { ...currentAddress };
  }

  employee.completionPercentage = calcCompletion(employee);
}

function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function isFilled(value) {
  if (Array.isArray(value)) return value.some(isFilled);
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (value && typeof value === 'object') {
    // Mongoose documents/subdocuments are complex objects. Convert to a plain
    // object before checking to avoid infinite recursion on internal properties.
    const target = value.toObject ? value.toObject() : value;
    return Object.values(target).some(isFilled);
  }
  if (typeof value === "boolean") return true;
  return value !== undefined && value !== null && value !== "" && value !== NA;
}

export function calcCompletion(employee) {
  const required = [
    "fullName",
    "dob",
    "gender",
    "maritalStatus",
    "personalMobile",
    "personalEmail",
    "aadharNumber",
    "panNumber",
    "highestQualification",
    "graduationYear",
    "instituteName",
    "dateJoining",
    "employmentType",
    "workLocation",
    "designation",
    "department",
    "officialEmail",
    "grossPerMonth",
    "ctcPerYear",
    "salaryPerMonth",
    "accountHolderName",
    "bankName",
    "accountNumber",
    "ifscCode",
  ];

  let filled = required.filter((field) => isFilled(employee[field])).length;
  filled += isFilled(employee.emergencyContacts) ? 1 : 0;
  filled += isFilled(employee.references) ? 1 : 0;

  return Math.round((filled / (required.length + 2)) * 100);
}

export default mongoose.model("Employee", employeeSchema);
