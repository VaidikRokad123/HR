import UserModel from "../models/UserModel.js";
import EmployeePersonalModel from "../models/EmployeePersonalModel.js";
import EmployeeProfessionalModel from "../models/EmployeeProfessionalModel.js";
import EmployeeAddressModel from "../models/EmployeeAddressModel.js";
import EmployeeEmergencyModel from "../models/EmployeeEmergencyModel.js";
import EmployeeBankModel from "../models/EmployeeBankModel.js";
import EmployeePayrollModel from "../models/EmployeePayrollModel.js";
import EmployeeDraftModel from "../models/EmployeeDraftModel.js";
import { generateEmpCode } from "../utils/empCodeUtils.js";
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from "../config/constants.js";

const NA = "not set yet";
const isBlank = (val) => val === undefined || val === null || val === "" || val === NA;
const cleanNA = (val) => (isBlank(val) ? undefined : val);
const hasValue = (val) => !isBlank(val);
const hasAnyValue = (...values) => values.some(hasValue);

const computePendingSections = (payload = {}) => {
  const pending = [];
  const emergency = payload.emergencyContacts?.[0] || {};
  const reference = payload.references?.[0] || {};

  if (
    [payload.fullName, payload.dob, payload.gender, payload.maritalStatus].some(isBlank)
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

  if ([payload.aadharNumber, payload.panNumber].some(isBlank)) {
    pending.push("government_id");
  }

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
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Employee code already exists" });
      }
    }

    const emailStr =
      cleanNA(payload.officialEmail) ||
      cleanNA(payload.personalEmail) ||
      `${emp_code.toLowerCase()}@company.com`;
    const email = emailStr.toLowerCase().trim();

    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const pending = computePendingSections(payload);

    const user = new UserModel({
      email,
      status: "approved",
      emp_code,
      pendingSections: pending,
    });
    await user.save();

    const userId = user._id;

    if (
      hasValue(payload.fullName) &&
      hasValue(payload.gender) &&
      hasValue(payload.dob) &&
      hasValue(payload.personalMobile)
    ) {
      const personal = new EmployeePersonalModel({
        userId,
        emp_code,
        fullName: cleanNA(payload.fullName),
        gender: cleanNA(payload.gender),
        dob: cleanNA(payload.dob),
        mobile: cleanNA(payload.personalMobile),
        personalEmail: cleanNA(payload.personalEmail),
        bloodGroup: "O+",
      });
      await personal.save();
    }

    if (
      hasAnyValue(
        payload.currentAddress?.street,
        payload.currentAddress?.city,
        payload.currentAddress?.state,
        payload.currentAddress?.pincode,
        payload.permanentAddress?.street,
        payload.permanentAddress?.city,
        payload.permanentAddress?.state,
        payload.permanentAddress?.pincode,
      )
    ) {
      const address = new EmployeeAddressModel({
        userId,
        emp_code,
        currentAddress: payload.currentAddress || {},
        permanentAddress: payload.sameAsCurrent
          ? payload.currentAddress
          : payload.permanentAddress || {},
      });
      await address.save();
    }

    if (payload.emergencyContacts && payload.emergencyContacts.length > 0) {
      const emg = payload.emergencyContacts[0];
      if (hasAnyValue(emg.name, emg.relationship, emg.phone)) {
        const emergency = new EmployeeEmergencyModel({
          userId,
          emp_code,
          emergencyContact1: {
            name: cleanNA(emg.name),
            relationship: cleanNA(emg.relationship),
            mobile: cleanNA(emg.phone),
          },
        });
        await emergency.save();
      }
    }

    if (
      hasValue(payload.dateJoining) &&
      hasValue(payload.department) &&
      hasValue(payload.designation) &&
      hasValue(payload.officialEmail)
    ) {
      const professional = new EmployeeProfessionalModel({
        userId,
        emp_code,
        dateJoined: cleanNA(payload.dateJoining),
        department: cleanNA(payload.department),
        jobTitle: cleanNA(payload.designation),
        employmentType: cleanNA(payload.employmentType),
        workEmail: cleanNA(payload.officialEmail) || email,
        reportingManager: cleanNA(payload.reportingManager),
        inProbation: true,
      });
      await professional.save();
    }

    if (
      hasAnyValue(
        payload.panNumber,
        payload.aadharNumber,
        payload.accountHolderName,
        payload.bankNameBranch,
        payload.accountNumber,
        payload.ifscCode,
      )
    ) {
      const bank = new EmployeeBankModel({
        userId,
        emp_code,
        panNumber: cleanNA(payload.panNumber),
        aadharNumber: cleanNA(payload.aadharNumber),
        bankName: cleanNA(payload.bankNameBranch),
        accountHolderName: cleanNA(payload.accountHolderName),
        personalAccountNumber: cleanNA(payload.accountNumber),
        personalIfsc: cleanNA(payload.ifscCode),
      });
      await bank.save();
    }

    const grossStr = cleanNA(payload.gross);
    const ctcStr = cleanNA(payload.ctc);

    if (grossStr && ctcStr) {
      const grossNum = grossStr ? Number(grossStr) : undefined;
      const ctcNum = ctcStr ? Number(ctcStr) : undefined;
      const pfVal = payload.pfApplicable || false;
      const esicVal = payload.esicApplicable || false;
      const ptVal = payload.ptApplicable || false;

      const payroll = new EmployeePayrollModel({
        userId,
        emp_code,
        gross: grossNum,
        ctc: ctcNum,
        pf: pfVal,
        esic: esicVal,
        pt: ptVal,
        history: [{
          gross: grossNum,
          ctc: ctcNum,
          pf: pfVal,
          esic: esicVal,
          pt: ptVal,
          changeType: 'initial setup',
          updatedAt: new Date()
        }]
      });
      await payroll.save();
    }

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

/**
 * @desc   Update an existing employee (called from AddEmployee.js edit mode)
 * @route  PUT /api/admin/employees/:id
 */
export const updateEmployee = async (req, res) => {
  try {
    const payload = req.body;
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const userId = user._id;
    const emp_code = user.emp_code;
    const pending = computePendingSections(payload);

    user.pendingSections = pending;
    user.status = "approved";
    await user.save();

    // ── Personal ─────────────────────────────────────────────────
    if (
      hasValue(payload.fullName) &&
      hasValue(payload.gender) &&
      hasValue(payload.dob) &&
      hasValue(payload.personalMobile)
    ) {
      await EmployeePersonalModel.findOneAndUpdate(
        { userId },
        {
          emp_code,
          fullName: cleanNA(payload.fullName),
          gender: cleanNA(payload.gender),
          dob: cleanNA(payload.dob),
          maritalStatus: cleanNA(payload.maritalStatus),
          religion: cleanNA(payload.religion),
          physicallyHandicapped: cleanNA(payload.physicallyHandicapped),
          mobile: cleanNA(payload.personalMobile),
          personalEmail: cleanNA(payload.personalEmail),
        },
        { upsert: true, new: true }
      );
    }

    // ── Address & Emergency ───────────────────────────────────────
    if (
      hasAnyValue(
        payload.currentAddress?.street,
        payload.currentAddress?.city,
        payload.currentAddress?.state,
        payload.currentAddress?.pincode,
        payload.permanentAddress?.street,
        payload.permanentAddress?.city,
        payload.permanentAddress?.state,
        payload.permanentAddress?.pincode,
      )
    ) {
      await EmployeeAddressModel.findOneAndUpdate(
        { userId },
        {
          emp_code,
          currentAddress: payload.currentAddress || {},
          permanentAddress: payload.sameAsCurrent
            ? payload.currentAddress
            : payload.permanentAddress || {},
        },
        { upsert: true, new: true }
      );

    }

    if (payload.emergencyContacts?.length > 0) {
      const emg = payload.emergencyContacts[0];
      if (hasAnyValue(emg.name, emg.relationship, emg.phone)) {
        await EmployeeEmergencyModel.findOneAndUpdate(
          { userId },
          {
            emp_code,
            emergencyContact1: {
              name: cleanNA(emg.name),
              relationship: cleanNA(emg.relationship),
              mobile: cleanNA(emg.phone),
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    // ── Professional ─────────────────────────────────────────────
    if (
      emp_code &&
      hasValue(payload.dateJoining) &&
      hasValue(payload.department) &&
      hasValue(payload.designation) &&
      hasValue(payload.officialEmail)
    ) {
      await EmployeeProfessionalModel.findOneAndUpdate(
        { $or: [{ userId }, { emp_code }] },
        {
          userId,
          emp_code,
          dateJoined: cleanNA(payload.dateJoining),
          department: cleanNA(payload.department),
          jobTitle: cleanNA(payload.designation),
          employmentType: cleanNA(payload.employmentType),
          workEmail: cleanNA(payload.officialEmail),
          reportingManager: cleanNA(payload.reportingManager),
          workMobile: cleanNA(payload.workMobile),
        },
        { upsert: true, new: true }
      );
    }

    // ── Bank & Payroll ────────────────────────────────────────────
    if (
      emp_code &&
      hasAnyValue(
        payload.panNumber,
        payload.aadharNumber,
        payload.accountHolderName,
        payload.bankNameBranch,
        payload.accountNumber,
        payload.ifscCode,
      )
    ) {
      await EmployeeBankModel.findOneAndUpdate(
        { $or: [{ userId }, { emp_code }] },
        {
          userId,
          emp_code,
          panNumber: cleanNA(payload.panNumber),
          aadharNumber: cleanNA(payload.aadharNumber),
          bankName: cleanNA(payload.bankNameBranch),
          accountHolderName: cleanNA(payload.accountHolderName),
          personalAccountNumber: cleanNA(payload.accountNumber),
          personalIfsc: cleanNA(payload.ifscCode),
        },
        { upsert: true, new: true }
      );

    }

    const grossStr = cleanNA(payload.gross);
    const ctcStr = cleanNA(payload.ctc);

    if (emp_code && grossStr && ctcStr) {
      const grossNum = grossStr ? Number(grossStr) : undefined;
      const ctcNum = ctcStr ? Number(ctcStr) : undefined;
      const pfVal = payload.pfApplicable || false;
      const esicVal = payload.esicApplicable || false;
      const ptVal = payload.ptApplicable || false;

      let payrollDoc = await EmployeePayrollModel.findOne({ $or: [{ userId }, { emp_code }] });
      
      if (!payrollDoc) {
        payrollDoc = new EmployeePayrollModel({
          userId,
          emp_code,
          gross: grossNum,
          ctc: ctcNum,
          pf: pfVal,
          esic: esicVal,
          pt: ptVal,
          history: [{
            gross: grossNum,
            ctc: ctcNum,
            pf: pfVal,
            esic: esicVal,
            pt: ptVal,
            changeType: 'initial setup',
            updatedAt: new Date()
          }]
        });
        await payrollDoc.save();
      } else {
        const changed = payrollDoc.gross !== grossNum || 
                        payrollDoc.ctc !== ctcNum || 
                        payrollDoc.pf !== pfVal || 
                        payrollDoc.esic !== esicVal || 
                        payrollDoc.pt !== ptVal;
                        
        if (changed) {
          payrollDoc.gross = grossNum;
          payrollDoc.ctc = ctcNum;
          payrollDoc.pf = pfVal;
          payrollDoc.esic = esicVal;
          payrollDoc.pt = ptVal;
          
          if (!payrollDoc.history) {
            payrollDoc.history = [];
          }
          
          payrollDoc.history.push({
            gross: grossNum,
            ctc: ctcNum,
            pf: pfVal,
            esic: esicVal,
            pt: ptVal,
            changeType: 'updated by admin',
            updatedAt: new Date()
          });
          
          await payrollDoc.save();
        }
      }
    }

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
