import UserModel from "../models/UserModel.js";
import EmployeeModel from "../models/EmployeeModel.js";
import {
  employeeQueryForUser,
  toCompatSections,
} from "../utils/employeeCompat.js";
import { buildInternshipOfferLetterStructuredData } from "../services/document/builders/internshipOfferLetterBuilder.js";
import { buildAppraisalLetterStructuredData } from "../services/document/builders/appraisalLetterBuilder.js";
import { buildJobOfferLetterStructuredData } from "../services/document/builders/jobOfferLetterBuilder.js";
import { generatePDFFromData } from "../services/document/core/pdfGenerator.js";
import {
  getLastDocumentData,
  setLastDocumentData,
} from "../services/document/core/documentState.js";

const DOCUMENT_TYPES = [
  { id: "job-offer-letter", label: "Job Offer Letter", available: true },
  { id: "internship-offer-letter", label: "Internship Offer Letter", available: true },
  { id: "appraisal-letter", label: "Appraisal Letter", available: true },
  {
    id: "experience-certificate",
    label: "Experience Certificate",
    available: false,
  },
  {
    id: "internship-completion-certificate",
    label: "Internship Completion Certificate",
    available: false,
  },
];

const REQUIRED_OFFER_FIELDS = [
  "name",
  "gender",
  "internType",
  "durationType",
  "duration",
  "role",
  "startDate",
  "endDate",
  "salaryType",
];

function pickKnownOfferValues(employee, override = {}) {
  const personal = employee.personal || {};
  const professional = employee.professional || {};
  const payroll = employee.payroll || {};

  const values = {
    name: personal.fullName || "",
    gender: personal.gender ? String(personal.gender).toLowerCase() : "",
    role: professional.jobTitle || "",
    startDate: professional.dateJoined
      ? new Date(professional.dateJoined).toISOString().slice(0, 10)
      : "",
    salaryAmount: payroll.grossPerMonth || payroll.ctcPerYear || "",
    companyName: process.env.COMPANY_NAME || "Saeculum Solutions Pvt. Ltd.",
    signatoryName: process.env.DOCUMENT_SIGNATORY_NAME || "HARDIKKUMAR VINZAVA",
    signatoryTitle: process.env.DOCUMENT_SIGNATORY_TITLE || "DIRECTOR",
    ...override,
  };

  if (values.gender && !["male", "female"].includes(values.gender)) {
    values.gender = "";
  }

  return values;
}

function missingOfferFields(values) {
  const required =
    values.salaryType === "paid"
      ? [...REQUIRED_OFFER_FIELDS, "salaryAmount"]
      : REQUIRED_OFFER_FIELDS;

  return required.filter((field) => !values[field]);
}

const REQUIRED_APPRAISAL_FIELDS = [
  "name",
  "gender",
  "role",
  "currentSalary",
  "revisedSalaryDate",
];

function pickKnownAppraisalValues(employee, override = {}) {
  const personal = employee.personal || {};
  const professional = employee.professional || {};
  const payroll = employee.payroll || {};

  const values = {
    name: personal.fullName || "",
    gender: personal.gender ? String(personal.gender).toLowerCase() : "",
    role: professional.jobTitle || "",
    currentSalary: payroll.ctcPerYear || payroll.grossPerMonth || "",
    revisedSalaryDate: "",
    companyName: process.env.COMPANY_NAME || "Saeculum Solutions Pvt. Ltd.",
    signatoryName: process.env.DOCUMENT_SIGNATORY_NAME || "HARDIKKUMAR VINZAVA",
    signatoryTitle: process.env.DOCUMENT_SIGNATORY_TITLE || "DIRECTOR",
    ...override,
  };

  if (values.gender && !["male", "female"].includes(values.gender)) {
    values.gender = "";
  }

  return values;
}

function missingAppraisalFields(values) {
  return REQUIRED_APPRAISAL_FIELDS.filter((field) => !values[field]);
}

async function loadEmployee(userId) {
  const user = await UserModel.findOne({
    _id: userId,
    status: "approved",
  }).select("-passwordHash");
  if (!user) return null;

  const employee = await EmployeeModel.findOne(employeeQueryForUser(user));
  const { personal, professional, payroll } = toCompatSections(employee, user);
  return { user, personal, professional, payroll };
}

export function getDocumentTypes(req, res) {
  res.json(DOCUMENT_TYPES);
}

export async function inspectOfferLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const values = pickKnownOfferValues(employee);

    res.json({
      documentType: "offer-letter",
      employee: {
        id: employee.user._id,
        emp_code: employee.user.emp_code,
        email: employee.user.email,
        name: values.name,
      },
      values,
      missingFields: missingOfferFields(values),
    });
  } catch (error) {
    console.error("Inspect offer letter error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function prepareOfferLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const values = pickKnownOfferValues(employee, req.body || {});
    const missingFields = missingOfferFields(values);
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: "Missing required fields", missingFields, values });
    }

    const data = buildInternshipOfferLetterStructuredData({
      ...values,
      documentType: "offer-letter",
      employeeId: employee.user._id,
      emp_code: employee.user.emp_code,
    });

    setLastDocumentData(data);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Prepare offer letter error:", error);
    const statusCode = error.message === "Missing required fields" ? 400 : 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Failed to prepare offer letter" });
  }
}

export async function getDocumentDraft(req, res) {
  const data = getLastDocumentData();
  if (!data) {
    return res.status(404).json({ message: "No document draft found" });
  }

  res.json({ success: true, data });
}

export async function compileDocument(req, res) {
  try {
    const { pages, metadata } = req.body;
    if (!Array.isArray(pages)) {
      return res.status(400).json({ message: "Pages array is required" });
    }

    const data = {
      metadata: metadata || getLastDocumentData()?.metadata || {},
      pages,
    };

    setLastDocumentData(data);
    const pdfUrl = await generatePDFFromData(data);
    res.json({
      success: true,
      message: "Document compiled successfully",
      path: pdfUrl,
      data,
    });
  } catch (error) {
    console.error("Compile document error:", error);
    res
      .status(500)
      .json({ message: "Failed to compile document", details: error.message });
  }
}

export async function inspectAppraisalLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const values = pickKnownAppraisalValues(employee);

    res.json({
      documentType: "appraisal-letter",
      employee: {
        id: employee.user._id,
        emp_code: employee.user.emp_code,
        email: employee.user.email,
        name: values.name,
      },
      values,
      missingFields: missingAppraisalFields(values),
    });
  } catch (error) {
    console.error("Inspect appraisal letter error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function prepareAppraisalLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const values = pickKnownAppraisalValues(employee, req.body || {});
    const missingFields = missingAppraisalFields(values);
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: "Missing required fields", missingFields, values });
    }

    const data = buildAppraisalLetterStructuredData({
      ...values,
      documentType: "appraisal-letter",
      employeeId: employee.user._id,
      emp_code: employee.user.emp_code,
    });

    setLastDocumentData(data);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Prepare appraisal letter error:", error);
    const statusCode = error.message === "Missing required fields" ? 400 : 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Failed to prepare appraisal letter" });
  }
}

export async function inspectJobOfferLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const personal = employee.personal || {};
    const professional = employee.professional || {};
    const payroll = employee.payroll || {};

    const values = {
      fullName: personal.fullName || "",
      gender: personal.gender ? String(personal.gender).toLowerCase() : "",
      designation: professional.designation || professional.jobTitle || "",
      ctcPerYear: payroll.ctcPerYear || "",
      dateJoining: professional.dateJoining || professional.dateJoined || "",
      officialEmail: professional.officialEmail || "",
      personalEmail: personal.personalEmail || "",
      reportingManager: professional.reportingManager || "",
      permanentAddress: personal.permanentAddress || {},
      currentAddress: personal.currentAddress || {},
    };

    const missingFields = ['fullName','designation','ctcPerYear','dateJoining'].filter(f => !values[f]);
    if (!values.officialEmail && !values.personalEmail) missingFields.push('email');

    res.json({
      documentType: "job-offer-letter",
      employee: { id: employee.user._id, emp_code: employee.user.emp_code, email: employee.user.email, name: values.fullName },
      values,
      missingFields,
    });
  } catch (error) {
    console.error("Inspect job offer letter error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function prepareJobOfferLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const personal = employee.personal || {};
    const professional = employee.professional || {};
    const payroll = employee.payroll || {};
    const overrides = req.body || {};

    const values = {
      fullName: overrides.fullName || personal.fullName || "",
      gender: overrides.gender || (personal.gender ? String(personal.gender).toLowerCase() : ""),
      designation: overrides.designation || professional.designation || professional.jobTitle || "",
      ctcPerYear: overrides.ctcPerYear || payroll.ctcPerYear || "",
      dateJoining: overrides.dateJoining || professional.dateJoining || professional.dateJoined || "",
      officialEmail: overrides.officialEmail || professional.officialEmail || "",
      personalEmail: overrides.personalEmail || personal.personalEmail || "",
      reportingManager: overrides.reportingManager || professional.reportingManager || "",
      permanentAddress: personal.permanentAddress || {},
      currentAddress: personal.currentAddress || {},
    };

    const missingFields = ['fullName','designation','ctcPerYear','dateJoining'].filter(f => !values[f]);
    if (!values.officialEmail && !values.personalEmail) missingFields.push('email');
    if (missingFields.length > 0) return res.status(400).json({ message: "Missing required fields", missingFields, values });

    const data = buildJobOfferLetterStructuredData(values);
    setLastDocumentData(data);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Prepare job offer letter error:", error);
    res.status(error.message?.includes('required') ? 400 : 500).json({ message: error.message || "Failed to prepare job offer letter" });
  }
}

import EmployeeDocumentModel from "../models/EmployeeDocumentModel.js";

export async function uploadEmployeeDocument(req, res) {
  try {
    const { emp_code } = req.params;
    const { category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (
      !category ||
      !["personal_identity", "onboarding", "offboarding"].includes(category)
    ) {
      return res.status(400).json({ message: "Invalid or missing category" });
    }

    const user = await UserModel.findOne({ emp_code });
    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const document = new EmployeeDocumentModel({
      userId: user._id,
      emp_code,
      category,
      fileName: file.originalname,
      filePath: file.path.replace(/\\/g, "/"),
    });

    await document.save();

    res
      .status(201)
      .json({ message: "Document uploaded successfully", document });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: "Server error during document upload" });
  }
}

export async function getEmployeeDocuments(req, res) {
  try {
    const { emp_code } = req.params;
    const documents = await EmployeeDocumentModel.find({ emp_code }).sort({
      createdAt: -1,
    });
    res.json(documents);
  } catch (error) {
    console.error("Get employee documents error:", error);
    res.status(500).json({ message: "Server error fetching documents" });
  }
}
