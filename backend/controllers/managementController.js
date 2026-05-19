import { validationResult } from "express-validator";
import crypto from "crypto";
import UserModel from "../models/UserModel.js";
import EmployeeModel from "../models/EmployeeModel.js";
import NotificationModel from "../models/NotificationModel.js";
import { generateEmpCode } from "../utils/empCodeUtils.js";
import { sendEmail } from "../utils/emailUtils.js";
import {
  appendPayrollHistoryIfChanged,
  employeeQueryForUser,
  hasBankDetails,
  hasPayrollDetails,
  moduleDataToEmployeeUpdate,
  normalizeEmployeePayload,
  toCompatSections,
} from "../utils/employeeCompat.js";

const sensitiveOtpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const getAdminEmail = () =>
  process.env.ADMIN_EMAIL ||
  process.env.HR_EMAIL ||
  process.env.EMAIL_CLIENT_MAIL ||
  process.env.EMAIL_USER;

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
};

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const buildSensitiveOtpEmail = ({ otp, employeeName, empCode }) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
    <div style="background: #111827; color: #fff; padding: 18px 22px;">
      <h2 style="margin: 0;">Sensitive Details Access OTP</h2>
    </div>
    <div style="padding: 22px; color: #111827;">
      <p>Use this OTP to view bank and payroll details for <strong>${employeeName || empCode || "the employee"}</strong>.</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 18px 0;">${otp}</div>
      <p style="color: #6b7280;">This OTP expires in 10 minutes. Do not share it outside authorized HR/admin access.</p>
    </div>
  </div>
`;

const isFilledValue = (value) => {
  if (Array.isArray(value)) return value.some(isFilledValue);
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (value && typeof value === "object") {
    return Object.values(value).some(isFilledValue);
  }
  if (typeof value === "boolean") return true;
  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    value !== "not set yet"
  );
};

const getNestedValue = (source, path) =>
  path.split(".").reduce((current, key) => current?.[key], source);
const countFilledFields = (source, fields) =>
  fields.reduce(
    (count, path) =>
      count + (isFilledValue(getNestedValue(source, path)) ? 1 : 0),
    0,
  );

const COMPLETION_FIELD_LABELS = {
  fullName: "Full name",
  dob: "Date of birth",
  gender: "Gender",
  maritalStatus: "Marital status",
  religion: "Religion",
  physicallyHandicapped: "Physically handicapped",
  bloodGroup: "Blood group",
  personalMobile: "Personal mobile",
  personalEmail: "Personal email",
  "currentAddress.street": "Current address street",
  "currentAddress.city": "Current address city",
  "currentAddress.state": "Current address state",
  "currentAddress.pincode": "Current address pincode",
  "permanentAddress.street": "Permanent address street",
  "permanentAddress.city": "Permanent address city",
  "permanentAddress.state": "Permanent address state",
  "permanentAddress.pincode": "Permanent address pincode",
  emergencyContacts: "Emergency contact",
  aadharNumber: "Aadhaar number",
  panNumber: "PAN number",
  highestQualification: "Highest qualification",
  graduationYear: "Graduation year",
  instituteName: "Institute name",
  references: "Reference",
  dateJoining: "Date joining",
  employmentType: "Employment type",
  probationMonths: "Probation months",
  confirmationDate: "Confirmation date",
  workLocation: "Work location",
  designation: "Designation",
  department: "Department",
  reportingManager: "Reporting manager",
  officialEmail: "Official email",
  workMobile: "Work mobile",
  laptopAssigned: "Laptop assigned",
  grossPerMonth: "Gross per month",
  ctcPerYear: "CTC per year",
  salaryPerMonth: "Salary per month",
  accountHolderName: "Account holder name",
  bankName: "Bank name",
  accountNumber: "Account number",
  ifscCode: "IFSC code",
  pfApplicable: "PF applicable",
  pfNumber: "PF number",
  uanNumber: "UAN number",
  esicApplicable: "ESIC applicable",
  esicNumber: "ESIC number",
  ptApplicable: "PT applicable",
  tdsRegime: "TDS regime",
  tdsDocProof: "TDS DOC PROOF",
};

const MODEL_PROGRESS_SECTIONS = [
  {
    key: "personal",
    label: "Personal",
    fields: [
      "fullName",
      "dob",
      "gender",
      "maritalStatus",
      "religion",
      "physicallyHandicapped",
      "bloodGroup",
    ],
  },
  {
    key: "contact",
    label: "Contact",
    fields: [
      "personalMobile",
      "personalEmail",
      "currentAddress.street",
      "currentAddress.city",
      "currentAddress.state",
      "currentAddress.pincode",
      "permanentAddress.street",
      "permanentAddress.city",
      "permanentAddress.state",
      "permanentAddress.pincode",
      "emergencyContacts",
    ],
  },
  {
    key: "government_id",
    label: "Government ID",
    fields: ["aadharNumber", "panNumber"],
  },
  {
    key: "education",
    label: "Education",
    fields: [
      "highestQualification",
      "graduationYear",
      "instituteName",
      "references",
    ],
  },
  {
    key: "employment",
    label: "Employment",
    fields: [
      "dateJoining",
      "employmentType",
      "probationMonths",
      "confirmationDate",
      "workLocation",
      "designation",
      "department",
      "reportingManager",
      "officialEmail",
      "workMobile",
      "laptopAssigned",
    ],
  },
  {
    key: "payroll",
    label: "Payroll",
    fields: [
      "grossPerMonth",
      "ctcPerYear",
      "salaryPerMonth",
      "accountHolderName",
      "bankName",
      "accountNumber",
      "ifscCode",
      "pfApplicable",
      "pfNumber",
      "uanNumber",
      "esicApplicable",
      "esicNumber",
      "ptApplicable",
      "tdsRegime",
      "tdsDocProof",
    ],
  },
];

const buildCompletionSnapshot = (employee = {}) => {
  const source = employee?.toObject ? employee.toObject() : employee || {};
  const sectionProgress = MODEL_PROGRESS_SECTIONS.map((section) => {
    const missingFields = section.fields
      .filter((path) => !isFilledValue(getNestedValue(source, path)))
      .map((path) => ({
        field: path,
        label: COMPLETION_FIELD_LABELS[path] || path,
      }));
    const filledFields = section.fields.length - missingFields.length;
    const percentage = section.fields.length
      ? Math.round((filledFields / section.fields.length) * 100)
      : 0;
    return {
      key: section.key,
      label: section.label,
      percentage,
      filledFields,
      totalFields: section.fields.length,
      missingFields,
    };
  });
  const totalFields = sectionProgress.reduce(
    (total, section) => total + section.totalFields,
    0,
  );
  const filledFields = sectionProgress.reduce(
    (total, section) => total + section.filledFields,
    0,
  );
  const completionPercentage = totalFields
    ? Math.round((filledFields / totalFields) * 100)
    : 0;
  const incompleteSections = sectionProgress.filter(
    (section) => section.percentage < 100,
  );
  const missingSections = incompleteSections.map((section) => section.label);
  const missingDetails = incompleteSections.map((section) => ({
    key: section.key,
    label: section.label,
    missingFields: section.missingFields,
  }));
  return {
    completionPercentage,
    filledFields,
    totalFields,
    missingSections,
    missingDetails,
    sectionProgress,
  };
};

const normalizeEmployeeStatus = async (user) => {
  if (!user || user.status === "approved") return "approved";
  user.status = "approved";
  await user.save();
  return "approved";
};

const buildEmployeeResponse = async (user, includeSensitive = false) => {
  const employee = await EmployeeModel.findOne(employeeQueryForUser(user));
  const sections = toCompatSections(employee, user);
  const completion = buildCompletionSnapshot(employee);
  const status = await normalizeEmployeeStatus(user);

  return {
    user: {
      id: user._id,
      email: user.email,
      emp_code: user.emp_code,
      status,
      pendingSections: user.pendingSections || employee?.pendingSections || [],
      createdAt: user.createdAt,
    },
    personal: sections.personal,
    education: sections.education,
    family: sections.family,
    address: sections.address,
    emergency: sections.emergency,
    professional: sections.professional,
    bank: includeSensitive ? sections.bank : null,
    payroll: includeSensitive ? sections.payroll : null,
    sensitiveDetailsLocked: !includeSensitive,
    hasBankDetails: hasBankDetails(employee || {}),
    hasPayrollDetails: hasPayrollDetails(employee || {}),
    completionPercentage: completion.completionPercentage,
    filledFields: completion.filledFields,
    totalFields: completion.totalFields,
    missingSections: completion.missingSections,
    missingDetails: completion.missingDetails,
    sectionProgress: completion.sectionProgress,
  };
};

export const getEmployeeById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select(
      "-passwordHash",
    );
    if (!user) return res.status(404).json({ message: "Employee not found" });
    const isAdminEditRequest = req.originalUrl?.includes("/admin/employees/");
    res.json(await buildEmployeeResponse(user, isAdminEditRequest));
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestSensitiveDetailsOtp = async (req, res) => {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail)
      return res.status(500).json({
        message: "Admin email is not configured. Set ADMIN_EMAIL or HR_EMAIL.",
      });

    const user = await UserModel.findById(req.params.id).select(
      "-passwordHash",
    );
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const employee = await EmployeeModel.findOne(employeeQueryForUser(user));
    const otp = String(crypto.randomInt(100000, 1000000));
    sensitiveOtpStore.set(String(user._id), {
      hash: hashOtp(otp),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    await sendEmail(
      adminEmail,
      "HRMS OTP for sensitive employee details",
      buildSensitiveOtpEmail({
        otp,
        employeeName: employee?.fullName,
        empCode: user.emp_code,
      }),
    );
    res.json({
      message: `OTP sent to ${maskEmail(adminEmail)}`,
      email: maskEmail(adminEmail),
    });
  } catch (error) {
    console.error("Request sensitive OTP error:", error);
    res.status(500).json({ message: error.message || "Failed to send OTP" });
  }
};

export const verifySensitiveDetailsOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: "OTP must be a 6-digit number" });

    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const user = await UserModel.findById(req.params.id).select(
      "-passwordHash",
    );
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const key = String(user._id);
    const record = sensitiveOtpStore.get(key);
    if (!record)
      return res.status(400).json({ message: "Please request a new OTP" });
    if (record.expiresAt < Date.now()) {
      sensitiveOtpStore.delete(key);
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new OTP" });
    }
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      sensitiveOtpStore.delete(key);
      return res.status(400).json({
        message: "Too many invalid attempts. Please request a new OTP",
      });
    }
    if (record.hash !== hashOtp(otp)) {
      record.attempts += 1;
      sensitiveOtpStore.set(key, record);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    sensitiveOtpStore.delete(key);
    const employee = await EmployeeModel.findOne(employeeQueryForUser(user));
    const { bank, payroll } = toCompatSections(employee, user);
    res.json({ message: "Sensitive details unlocked", bank, payroll });
  } catch (error) {
    console.error("Verify sensitive OTP error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

export const editEmployee = async (req, res) => {
  try {
    const { module, data } = req.body;
    if (!module || !data)
      return res.status(400).json({ message: "Module and data are required" });

    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const update = moduleDataToEmployeeUpdate(module, data);
    if (!update)
      return res.status(400).json({ message: "Invalid module name" });

    if (module === "professional" && data.probationDuration) {
      const duration = parseInt(data.probationDuration, 10);
      if (isNaN(duration) || duration < 0 || duration > 12) {
        return res.status(400).json({
          message:
            "Probation duration must be a number between 0 and 12 months.",
        });
      }
    }

    let employee = await EmployeeModel.findOne(employeeQueryForUser(user));
    if (!employee)
      employee = new EmployeeModel({
        userId: user._id,
        emp_code: user.emp_code,
      });

    employee.set(update);
    if (module === "payroll") appendPayrollHistoryIfChanged(employee, data);
    await employee.save();

    const sections = toCompatSections(employee, user);
    res.json({
      message: `${module} details updated successfully`,
      data: sections[module] || employee,
    });
  } catch (error) {
    console.error("Edit employee error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: `Validation failed: ${messages.join(", ")}` });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const exportAllEmployees = async (req, res) => {
  try {
    const users = await UserModel.find({ status: { $ne: "rejected" } }).select(
      "-passwordHash",
    );
    const employees = await Promise.all(
      users.map(async (user) => buildEmployeeResponse(user, true)), // includeSensitive = true
    );
    res.json(employees);
  } catch (error) {
    console.error("Export all employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const users = await UserModel.find({ status: { $ne: "rejected" } }).select(
      "-passwordHash",
    );
    const employees = await Promise.all(
      users.map(async (user) => buildEmployeeResponse(user)),
    );

    for (const row of employees) {
      const employee = await EmployeeModel.findOne({
        emp_code: row.user.emp_code,
      });
      if (
        employee?.inProbation &&
        employee?.probationMonths &&
        employee?.dateJoining &&
        !employee.probationEndedNotified
      ) {
        const probationEndDate = new Date(employee.dateJoining);
        probationEndDate.setMonth(
          probationEndDate.getMonth() + Number(employee.probationMonths),
        );
        if (new Date() >= probationEndDate) {
          await NotificationModel.create({
            toRole: "admin",
            message: `Probation period has ended for ${employee.fullName || row.user.email} (${row.user.emp_code}). Please review their status.`,
          });
          employee.probationEndedNotified = true;
          await employee.save();
        }
      }
    }

    res.json(employees);
  } catch (error) {
    console.error("Get all employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPendingPayrolls = async (req, res) => {
  try {
    const employees = await EmployeeModel.find({
      emp_code: { $exists: true, $ne: null },
      dateJoining: { $exists: true, $ne: null },
      exitDate: { $eq: null },
    });
    const pendingPayrolls = [];

    for (const emp of employees) {
      if (hasPayrollDetails(emp)) continue;
      const user = await UserModel.findOne({
        _id: emp.userId,
        status: "approved",
        emp_code: emp.emp_code,
      }).select("email status createdAt emp_code");
      if (!user) continue;
      const sections = toCompatSections(emp, user);
      pendingPayrolls.push({
        user: {
          id: emp.userId,
          email: user.email,
          emp_code: emp.emp_code,
          dateJoined: emp.dateJoining,
        },
        personal: sections.personal,
        professional: {
          department: emp.department,
          jobTitle: emp.designation,
          employmentType: emp.employmentType,
          workEmail: emp.officialEmail,
        },
      });
    }

    pendingPayrolls.sort(
      (a, b) => new Date(a.user.dateJoined) - new Date(b.user.dateJoined),
    );
    res.json(pendingPayrolls);
  } catch (error) {
    console.error("Get pending payrolls error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addPayrollDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const employee = await EmployeeModel.findOne(employeeQueryForUser(user));
    if (!employee)
      return res
        .status(400)
        .json({ message: "Employee details not found for this employee" });
    if (hasPayrollDetails(employee))
      return res
        .status(400)
        .json({ message: "Payroll details already exist for this employee" });

    employee.set(normalizeEmployeePayload(req.body));
    appendPayrollHistoryIfChanged(employee, req.body, "initial setup");
    await employee.save();

    const { payroll } = toCompatSections(employee, user);
    res
      .status(201)
      .json({ message: "Payroll details added successfully", payroll });
  } catch (error) {
    console.error("Add payroll details error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: `Validation failed: ${messages.join(", ")}` });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const bulkUploadEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!employees || !Array.isArray(employees))
      return res.status(400).json({
        message: "Invalid data format. Expected an array of employees.",
      });

    const createdUsers = [];
    const errors = [];

    for (const [index, empData] of employees.entries()) {
      try {
        const {
          user: userData = {},
          personal = {},
          professional = {},
          family = {},
          address = {},
          bank = {},
          emergency = {},
          payroll = {},
          education = {},
        } = empData;
        let email =
          userData.email ||
          personal.personalEmail ||
          professional.workEmail ||
          `temp${Date.now()}${index}@example.com`;
        email = email.toLowerCase().trim();
        const empCodeFromSheet = empData.emp_code || userData.emp_code;

        let user = await UserModel.findOne({
          $or: [
            { email },
            ...(empCodeFromSheet ? [{ emp_code: empCodeFromSheet }] : []),
          ],
        });
        const isUpdate = Boolean(user);
        if (!user) {
          user = await UserModel.create({
            email,
            status: "approved",
            emp_code: empCodeFromSheet || (await generateEmpCode()),
          });
        } else {
          if (!user.emp_code)
            user.emp_code = empCodeFromSheet || (await generateEmpCode());
          user.status = "approved";
          await user.save();
        }

        const payload = normalizeEmployeePayload({
          ...personal,
          ...professional,
          ...family,
          ...address,
          ...bank,
          ...payroll,
          ...emergency,
          ...education,
          emp_code: user.emp_code,
          userId: user._id,
          personalEmail: personal.personalEmail || email,
          officialEmail:
            professional.workEmail || professional.officialEmail || email,
        });

        let employee = await EmployeeModel.findOne(employeeQueryForUser(user));
        if (!employee)
          employee = new EmployeeModel({
            userId: user._id,
            emp_code: user.emp_code,
          });
        employee.set(payload);
        if (payload.ctcPerYear || payload.grossPerMonth || payload.salaryPerMonth)
          appendPayrollHistoryIfChanged(
            employee,
            payload,
            isUpdate ? "updated by bulk upload" : "initial setup",
          );
        await employee.save();

        createdUsers.push({ email, emp_code: user.emp_code, isUpdate });
      } catch (err) {
        console.error(`Error processing row ${index}:`, err);
        errors.push({ index, message: err.message });
      }
    }

    res.status(200).json({
      message: "Bulk upload completed",
      successCount: createdUsers.length,
      errorCount: errors.length,
      createdUsers,
      errors,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Server error during bulk upload" });
  }
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (fromDate, toDate) =>
  Math.round((startOfDay(toDate) - startOfDay(fromDate)) / 86400000);

const nextAnnualDate = (sourceDate, today = new Date()) => {
  const source = new Date(sourceDate);
  const next = startOfDay(today);
  next.setMonth(source.getMonth(), source.getDate());
  if (next < startOfDay(today)) next.setFullYear(next.getFullYear() + 1);
  return next;
};

const isCompleteEmployeeProfile = (employee) => {
  if (!employee?.linkedinUrl) return false;
  if (employee.companyOpensBank)
    return Boolean(
      employee.panNumber &&
      employee.aadharNumber &&
      employee.permissionToUsePanAadhar,
    );
  return Boolean(
    employee.bankName && employee.accountNumber && employee.ifscCode,
  );
};

export const collectUpcomingEvents = async () => {
  const today = startOfDay(new Date());
  const events = {
    birthdays: [],
    anniversaries: [],
    probation: [],
    incompleteProfiles: [],
    payrollPending: [],
  };
  const approvedUsers = await UserModel.find({
    status: "approved",
    emp_code: { $exists: true, $ne: null },
  }).select("email emp_code createdAt");

  for (const user of approvedUsers) {
    const emp = await EmployeeModel.findOne(employeeQueryForUser(user));
    if (!emp) continue;
    const base = {
      userId: user._id,
      email: user.email,
      emp_code: user.emp_code,
      fullName: emp.fullName,
      department: emp.department,
      jobTitle: emp.designation,
    };

    if (emp.dob) {
      const nextBirthday = nextAnnualDate(emp.dob, today);
      const daysLeft = daysBetween(today, nextBirthday);
      if (daysLeft >= 0 && daysLeft <= 7)
        events.birthdays.push({ ...base, dob: nextBirthday, daysLeft });
    }

    if (emp.dateJoining && !emp.exitDate) {
      const nextAnniversary = nextAnnualDate(emp.dateJoining, today);
      const yearsCompleted =
        nextAnniversary.getFullYear() - new Date(emp.dateJoining).getFullYear();
      const daysLeft = daysBetween(today, nextAnniversary);
      if (yearsCompleted > 0 && daysLeft >= 0 && daysLeft <= 7)
        events.anniversaries.push({
          ...base,
          dateJoined: nextAnniversary,
          originalDateJoined: emp.dateJoining,
          yearsCompleted,
          daysLeft,
        });
    }

    if (
      emp.inProbation &&
      emp.dateJoining &&
      emp.probationMonths !== undefined &&
      emp.probationMonths !== null
    ) {
      const probationEndDate = new Date(emp.dateJoining);
      probationEndDate.setMonth(
        probationEndDate.getMonth() + Number(emp.probationMonths || 0),
      );
      const daysLeft = daysBetween(today, probationEndDate);
      if (daysLeft >= 0 && daysLeft <= 7)
        events.probation.push({ ...base, probationEndDate, daysLeft });
    }

    if (!isCompleteEmployeeProfile(emp)) {
      const approvedAt = emp.createdAt || user.createdAt;
      const daysSinceApproval = daysBetween(approvedAt, today);
      if (daysSinceApproval >= 3)
        events.incompleteProfiles.push({
          ...base,
          approvedAt,
          daysSinceApproval,
        });
    }

    if (emp.dateJoining && !emp.exitDate && !hasPayrollDetails(emp)) {
      const daysSinceJoining = daysBetween(emp.dateJoining, today);
      if (daysSinceJoining >= 7)
        events.payrollPending.push({
          ...base,
          dateJoined: emp.dateJoining,
          daysSinceJoining,
        });
    }
  }

  Object.values(events).forEach((items) => {
    items.sort((a, b) => {
      const aDays =
        a.daysLeft ?? a.daysSinceApproval ?? a.daysSinceJoining ?? 0;
      const bDays =
        b.daysLeft ?? b.daysSinceApproval ?? b.daysSinceJoining ?? 0;
      return aDays - bDays;
    });
  });

  return events;
};

const formatEventDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN") : "N/A";
const renderEventRows = (items, renderDetail) => {
  if (!items.length)
    return '<tr><td colspan="4" style="padding: 10px; color: #777;">No items</td></tr>';
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-top: 1px solid #eee;">${item.fullName || item.email || item.emp_code}</td>
      <td style="padding: 10px; border-top: 1px solid #eee;">${item.emp_code || "N/A"}</td>
      <td style="padding: 10px; border-top: 1px solid #eee;">${item.department || "N/A"}</td>
      <td style="padding: 10px; border-top: 1px solid #eee;">${renderDetail(item)}</td>
    </tr>
  `,
    )
    .join("");
};
const renderEventSection = (title, items, renderDetail) => `
  <h3 style="margin: 24px 0 8px;">${title} (${items.length})</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <thead><tr style="background: #f8f9fa;"><th style="text-align: left; padding: 10px;">Employee</th><th style="text-align: left; padding: 10px;">Code</th><th style="text-align: left; padding: 10px;">Department</th><th style="text-align: left; padding: 10px;">Details</th></tr></thead>
    <tbody>${renderEventRows(items, renderDetail)}</tbody>
  </table>
`;

const buildUpcomingEventsEmail = (events) => {
  const total = Object.values(events).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  return {
    subject: `HRMS Upcoming Events Summary - ${total} alert(s)`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background: #f7941d; color: #fff; padding: 18px 22px;"><h2 style="margin: 0;">Upcoming Events Summary</h2><p style="margin: 6px 0 0;">Generated from HRMS for the next 7 days and pending actions.</p></div>
        <div style="padding: 22px;">
          <p><strong>Total alert(s):</strong> ${total}</p>
          ${renderEventSection("Upcoming Birthdays", events.birthdays, (item) => `${formatEventDate(item.dob)} - in ${item.daysLeft} day(s)`)}
          ${renderEventSection("Work Anniversaries", events.anniversaries, (item) => `${item.yearsCompleted} year(s) - in ${item.daysLeft} day(s)`)}
          ${renderEventSection("Probation Ending Soon", events.probation, (item) => `${formatEventDate(item.probationEndDate)} - in ${item.daysLeft} day(s)`)}
          ${renderEventSection("Incomplete Profiles", events.incompleteProfiles, (item) => `${item.daysSinceApproval} day(s) since approval`)}
          ${renderEventSection("Payroll Setup Pending", events.payrollPending, (item) => `Joined ${formatEventDate(item.dateJoined)} - ${item.daysSinceJoining} day(s) ago`)}
        </div>
      </div>
    `,
  };
};

export const sendUpcomingEventsEmail = async () => {
  if (!process.env.HR_EMAIL)
    throw new Error("HR_EMAIL is not configured in environment variables.");
  const events = await collectUpcomingEvents();
  const { subject, body } = buildUpcomingEventsEmail(events);
  await sendEmail(process.env.HR_EMAIL, subject, body);
  return events;
};

export const getUpcomingEvents = async (req, res) => {
  try {
    res.json(await collectUpcomingEvents());
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
