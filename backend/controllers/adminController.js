import UserModel from "../models/UserModel.js";
import EmployeeModel from "../models/EmployeeModel.js";
import EmployeeDraftModel from "../models/EmployeeDraftModel.js";
import { generateEmpCode } from "../utils/empCodeUtils.js";
import {
  DEPARTMENTS,
  DESIGNATIONS,
  EMPLOYMENT_TYPES,
} from "../config/constants.js";
import {
  NA,
  cleanNA,
  hasAnyValue,
  isBlank,
  normalizeEmployeePayload,
  appendPayrollHistoryIfChanged,
} from "../utils/employeeCompat.js";

const computePendingSections = (payload = {}) => {
  const pending = [];
  const emergency = payload.emergencyContacts?.[0] || {};
  const reference = payload.references?.[0] || {};

  if (
    [payload.fullName, payload.dob, payload.gender, payload.maritalStatus].some(
      isBlank,
    )
  ) {
    pending.push("identity");
  }

  if (
    [
      payload.personalMobile,
      payload.personalEmail,
      payload.currentAddress?.street,
      payload.currentAddress?.state,
      payload.currentAddress?.city,
      payload.sameAsCurrent ? "same" : payload.permanentAddress?.street,
      payload.sameAsCurrent ? "same" : payload.permanentAddress?.state,
      payload.sameAsCurrent ? "same" : payload.permanentAddress?.city,
      emergency.name,
      emergency.phone,
      emergency.relationship,
    ].some(isBlank)
  ) {
    pending.push("contact");
  }

  if ([payload.aadharNumber, payload.panNumber].some(isBlank))
    pending.push("government_id");

  if (
    [
      payload.highestQualification,
      payload.graduationYear,
      payload.instituteName,
      reference.name,
      reference.phone,
    ].some(isBlank)
  ) {
    pending.push("education");
  }

  if (
    [
      payload.dateJoining,
      payload.employmentType,
      payload.workLocation,
      payload.designation,
      payload.department,
      payload.officialEmail,
    ].some(isBlank)
  ) {
    pending.push("employment");
  }

  if (
    [
      payload.gross,
      payload.ctc,
      payload.accountHolderName,
      payload.bankNameBranch,
      payload.accountNumber,
      payload.ifscCode,
    ].some(isBlank)
  ) {
    pending.push("payroll");
  }

  return pending;
};

const buildEmployeePayload = (payload, userId, emp_code, email) =>
  normalizeEmployeePayload(payload, {
    userId,
    emp_code,
    fullName: cleanNA(payload.fullName),
    gender: cleanNA(payload.gender),
    dob: cleanNA(payload.dob),
    maritalStatus: cleanNA(payload.maritalStatus) || NA,
    personalMobile: cleanNA(payload.personalMobile),
    personalEmail: cleanNA(payload.personalEmail) || email,
    bloodGroup: cleanNA(payload.bloodGroup) || NA,
    aadharNumber: cleanNA(payload.aadharNumber),
    panNumber: cleanNA(payload.panNumber),
    highestQualification: cleanNA(payload.highestQualification),
    graduationYear: cleanNA(payload.graduationYear),
    instituteName: cleanNA(payload.instituteName),
    currentAddress: payload.currentAddress || {},
    sameAsCurrent: Boolean(payload.sameAsCurrent),
    permanentAddress: payload.sameAsCurrent
      ? payload.currentAddress || {}
      : payload.permanentAddress || {},
    emergencyContacts: (payload.emergencyContacts || []).filter((contact) =>
      hasAnyValue(contact?.name, contact?.phone, contact?.relationship),
    ),
    references: (payload.references || []).filter((ref) =>
      hasAnyValue(ref?.name, ref?.phone, ref?.email),
    ),
    officialEmail: cleanNA(payload.officialEmail) || email,
    dateJoining: cleanNA(payload.dateJoining),
    department: cleanNA(payload.department),
    designation: cleanNA(payload.designation),
    employmentType: cleanNA(payload.employmentType),
    workLocation: cleanNA(payload.workLocation),
    pendingSections: computePendingSections(payload),
  });

export const getRefData = (req, res) => {
  res.json({
    genders: ["Male", "Female", "Other"],
    maritalStatuses: ["Single", "Married", "Divorced", "Engaged"],
    departments: DEPARTMENTS,
    designations: DESIGNATIONS,
    employmentTypes: EMPLOYMENT_TYPES,
  });
};

export const getNextEmpCode = async (req, res) => {
  try {
    const code = await generateEmpCode();
    res.json({ code });
  } catch (error) {
    res.status(500).json({ message: "Error generating employee code" });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { draftId, formData, currentStep } = req.body;
    await EmployeeDraftModel.findOneAndUpdate(
      { draftId },
      { formData, currentStep, updatedAt: new Date() },
      { upsert: true },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to save draft" });
  }
};

export const getDraft = async (req, res) => {
  try {
    const draft = await EmployeeDraftModel.findOne({ draftId: req.params.id });
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch draft" });
  }
};

export const deleteDraft = async (req, res) => {
  try {
    await EmployeeDraftModel.deleteOne({ draftId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete draft" });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const payload = req.body;
    let emp_code = payload.emp_code;

    if (!emp_code || emp_code === NA || emp_code === "") {
      emp_code = await generateEmpCode();
    } else {
      const existingUser = await UserModel.findOne({ emp_code });
      if (existingUser)
        return res
          .status(400)
          .json({ message: "Employee code already exists" });
    }

    const emailStr =
      cleanNA(payload.officialEmail) ||
      cleanNA(payload.personalEmail) ||
      `${emp_code.toLowerCase()}@company.com`;
    const email = emailStr.toLowerCase().trim();

    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email already in use" });

    const pending = computePendingSections(payload);
    const user = await UserModel.create({
      email,
      status: "approved",
      emp_code,
      pendingSections: pending,
    });

    const employee = new EmployeeModel(
      buildEmployeePayload(payload, user._id, emp_code, email),
    );
    appendPayrollHistoryIfChanged(employee, payload, "initial setup");
    await employee.save();

    res.status(201).json({
      message: "Employee added successfully",
      emp_code,
      status: user.status,
      pendingSections: user.pendingSections,
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors)
        .map((v) => v.message)
        .join(", ");
      return res.status(400).json({ message: "Validation failed: " + msgs });
    }
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const payload = req.body;
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const pending = computePendingSections(payload);
    user.pendingSections = pending;
    user.status = "approved";
    await user.save();

    const email = (
      cleanNA(payload.officialEmail) ||
      cleanNA(payload.personalEmail) ||
      user.email
    )
      .toLowerCase()
      .trim();
    if (email !== user.email) {
      const existingEmail = await UserModel.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existingEmail)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
      await user.save();
    }

    let employee = await EmployeeModel.findOne({
      $or: [{ userId: user._id }, { emp_code: user.emp_code }],
    });
    if (!employee)
      employee = new EmployeeModel({
        userId: user._id,
        emp_code: user.emp_code,
      });

    employee.set(buildEmployeePayload(payload, user._id, user.emp_code, email));
    appendPayrollHistoryIfChanged(employee, payload);
    await employee.save();

    res.json({
      message: "Employee updated successfully",
      status: user.status,
      pendingSections: user.pendingSections,
    });
  } catch (error) {
    console.error("Update Employee Error:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors)
        .map((v) => v.message)
        .join(", ");
      return res.status(400).json({ message: "Validation failed: " + msgs });
    }
    res.status(500).json({ message: error.message || "Server error" });
  }
};
