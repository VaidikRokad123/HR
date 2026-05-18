import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import EmployeePayrollModel from '../models/EmployeePayrollModel.js';
import { buildOfferLetterStructuredData } from '../services/offerLetter/offerLetterDataBuilder.js';
import { generatePDFFromData } from '../services/offerLetter/pdfGenerator.js';
import { getLastOfferLetterData, setLastOfferLetterData } from '../services/offerLetter/offerLetterState.js';

const DOCUMENT_TYPES = [
  { id: 'offer-letter', label: 'Offer Letter', available: true },
  { id: 'appraisal-letter', label: 'Appraisal Letter', available: false },
  { id: 'experience-certificate', label: 'Experience Certificate', available: false },
  { id: 'internship-completion-certificate', label: 'Internship Completion Certificate', available: false }
];

const REQUIRED_OFFER_FIELDS = [
  'name',
  'gender',
  'internType',
  'durationType',
  'duration',
  'role',
  'startDate',
  'endDate',
  'salaryType'
];

function pickKnownOfferValues(employee, override = {}) {
  const personal = employee.personal || {};
  const professional = employee.professional || {};
  const payroll = employee.payroll || {};

  const values = {
    name: personal.fullName || '',
    gender: personal.gender ? String(personal.gender).toLowerCase() : '',
    role: professional.jobTitle || '',
    startDate: professional.dateJoined ? new Date(professional.dateJoined).toISOString().slice(0, 10) : '',
    salaryAmount: payroll.gross || payroll.ctc || '',
    companyName: process.env.COMPANY_NAME || 'SAECULUM SOLUTIONS PVT LTD',
    signatoryName: process.env.DOCUMENT_SIGNATORY_NAME || 'HARDIKKUMAR VINZAVA',
    signatoryTitle: process.env.DOCUMENT_SIGNATORY_TITLE || 'DIRECTOR',
    ...override
  };

  if (values.gender && !['male', 'female'].includes(values.gender)) {
    values.gender = '';
  }

  return values;
}

function missingOfferFields(values) {
  const required = values.salaryType === 'paid'
    ? [...REQUIRED_OFFER_FIELDS, 'salaryAmount']
    : REQUIRED_OFFER_FIELDS;

  return required.filter((field) => !values[field]);
}

async function loadEmployee(userId) {
  const user = await UserModel.findOne({ _id: userId, status: 'approved' }).select('-passwordHash');
  if (!user) return null;

  const [personal, professional, payroll] = await Promise.all([
    EmployeePersonalModel.findOne({ emp_code: user.emp_code }),
    EmployeeProfessionalModel.findOne({ emp_code: user.emp_code }),
    EmployeePayrollModel.findOne({ emp_code: user.emp_code })
  ]);

  return { user, personal, professional, payroll };
}

export function getDocumentTypes(req, res) {
  res.json(DOCUMENT_TYPES);
}

export async function inspectOfferLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const values = pickKnownOfferValues(employee);

    res.json({
      documentType: 'offer-letter',
      employee: {
        id: employee.user._id,
        emp_code: employee.user.emp_code,
        email: employee.user.email,
        name: values.name
      },
      values,
      missingFields: missingOfferFields(values)
    });
  } catch (error) {
    console.error('Inspect offer letter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function prepareOfferLetter(req, res) {
  try {
    const employee = await loadEmployee(req.params.userId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const values = pickKnownOfferValues(employee, req.body || {});
    const missingFields = missingOfferFields(values);
    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'Missing required fields', missingFields, values });
    }

    const data = buildOfferLetterStructuredData({
      ...values,
      documentType: 'offer-letter',
      employeeId: employee.user._id,
      emp_code: employee.user.emp_code
    });

    setLastOfferLetterData(data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Prepare offer letter error:', error);
    const statusCode = error.message === 'Missing required fields' ? 400 : 500;
    res.status(statusCode).json({ message: error.message || 'Failed to prepare offer letter' });
  }
}

export async function getDocumentDraft(req, res) {
  const data = getLastOfferLetterData();
  if (!data) {
    return res.status(404).json({ message: 'No document draft found' });
  }

  res.json({ success: true, data });
}

export async function compileDocument(req, res) {
  try {
    const { pages, metadata } = req.body;
    if (!Array.isArray(pages)) {
      return res.status(400).json({ message: 'Pages array is required' });
    }

    const data = {
      metadata: metadata || getLastOfferLetterData()?.metadata || {},
      pages
    };

    setLastOfferLetterData(data);
    const pdfUrl = await generatePDFFromData(data);
    res.json({ success: true, message: 'Document compiled successfully', path: pdfUrl, data });
  } catch (error) {
    console.error('Compile document error:', error);
    res.status(500).json({ message: 'Failed to compile document', details: error.message });
  }
}

import EmployeeDocumentModel from '../models/EmployeeDocumentModel.js';

export async function uploadEmployeeDocument(req, res) {
  try {
    const { emp_code } = req.params;
    const { category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!category || !['personal_identity', 'onboarding', 'offboarding'].includes(category)) {
      return res.status(400).json({ message: 'Invalid or missing category' });
    }

    const user = await UserModel.findOne({ emp_code });
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const document = new EmployeeDocumentModel({
      userId: user._id,
      emp_code,
      category,
      fileName: file.originalname,
      filePath: file.path.replace(/\\/g, '/')
    });

    await document.save();

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error during document upload' });
  }
}

export async function getEmployeeDocuments(req, res) {
  try {
    const { emp_code } = req.params;
    const documents = await EmployeeDocumentModel.find({ emp_code }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Get employee documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
}
