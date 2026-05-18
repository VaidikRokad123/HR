import bcrypt from 'bcryptjs';
import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import EmployeeBankModel from '../models/EmployeeBankModel.js';
import EmployeePayrollModel from '../models/EmployeePayrollModel.js';
import EmployeeDraftModel from '../models/EmployeeDraftModel.js';
import { generateEmpCode } from '../utils/empCodeUtils.js';
import { DEPARTMENTS, DESIGNATIONS } from '../config/rbac.js';

const NA = 'not set yet';
const cleanNA = (val) => val === NA ? undefined : val;

export const getRefData = (req, res) => {
  res.json({
    genders: ['Male', 'Female', 'Other'],
    maritalStatuses: ['Single', 'Married', 'Divorced', 'Engaged'],
    departments: DEPARTMENTS,
    designations: DESIGNATIONS
  });
};

export const getNextEmpCode = async (req, res) => {
  try {
    const code = await generateEmpCode();
    res.json({ code });
  } catch (error) {
    res.status(500).json({ message: 'Error generating employee code' });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { draftId, formData, currentStep } = req.body;
    await EmployeeDraftModel.findOneAndUpdate(
      { draftId },
      { formData, currentStep, updatedAt: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save draft' });
  }
};

export const getDraft = async (req, res) => {
  try {
    const draft = await EmployeeDraftModel.findOne({ draftId: req.params.id });
    if (!draft) return res.status(404).json({ message: 'Draft not found' });
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch draft' });
  }
};

export const deleteDraft = async (req, res) => {
  try {
    await EmployeeDraftModel.deleteOne({ draftId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete draft' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const payload = req.body;
    
    // 1. Generate or use emp_code
    let emp_code = payload.emp_code;
    if (!emp_code || emp_code === NA || emp_code === '') {
      emp_code = await generateEmpCode();
    } else {
      // Ensure unique emp_code
      const existingUser = await UserModel.findOne({ emp_code });
      if (existingUser) {
        return res.status(400).json({ message: 'Employee code already exists' });
      }
    }

    // 2. Create User
    const emailStr = cleanNA(payload.officialEmail) || cleanNA(payload.personalEmail) || `${emp_code.toLowerCase()}@company.com`;
    const email = emailStr.toLowerCase().trim();
    
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Welcome@123', salt);

    const user = new UserModel({
      email,
      passwordHash,
      role: 'employee',
      status: 'approved',
      emp_code
    });
    await user.save();
    
    const userId = user._id;

    const pending = payload.pendingSections || [];

    // 3. Personal (if not pending)
    if (!pending.includes('identity')) {
      const personal = new EmployeePersonalModel({
        userId,
        emp_code,
        fullName: cleanNA(payload.fullName),
        gender: cleanNA(payload.gender),
        dob: cleanNA(payload.dob),
        mobile: cleanNA(payload.personalMobile),
        personalEmail: cleanNA(payload.personalEmail),
        bloodGroup: 'O+' // Default fallback if not in form
      });
      await personal.save();
    }

    // 4. Address (if contact not pending)
    if (!pending.includes('contact')) {
      const address = new EmployeeAddressModel({
        userId,
        emp_code,
        currentAddress: payload.currentAddress || {},
        permanentAddress: payload.sameAsCurrent ? payload.currentAddress : (payload.permanentAddress || {})
      });
      await address.save();
    }

    // 5. Emergency Contacts (if contact not pending)
    if (!pending.includes('contact') && payload.emergencyContacts && payload.emergencyContacts.length > 0) {
      const emg = payload.emergencyContacts[0]; 
      if (cleanNA(emg.name)) {
        const emergency = new EmployeeEmergencyModel({
          userId,
          emp_code,
          emergencyContact1: {
            name: cleanNA(emg.name),
            relationship: cleanNA(emg.relationship),
            mobile: cleanNA(emg.phone)
          }
        });
        await emergency.save();
      }
    }

    // 6. Professional (if not pending)
    if (!pending.includes('employment')) {
      const dept = cleanNA(payload.department) || 'Engineering'; // fallback if misconfigured
      const title = cleanNA(payload.designation) || 'Software Engineer';
      const type = cleanNA(payload.employmentType) || 'Full-Time';

      const professional = new EmployeeProfessionalModel({
        userId,
        emp_code,
        dateJoined: cleanNA(payload.dateJoining) || new Date(),
        department: dept,
        jobTitle: title,
        employmentType: type,
        workEmail: cleanNA(payload.officialEmail) || email,
        reportingManager: cleanNA(payload.reportingManager),
        inProbation: true // default
      });
      await professional.save();
    }

    // 7. Bank & Payroll (if not pending)
    if (!pending.includes('payroll')) {
      const panNumber = !pending.includes('government_id') ? cleanNA(payload.panNumber) : undefined;
      const aadharNumber = !pending.includes('government_id') ? cleanNA(payload.aadharNumber) : undefined;

      const bank = new EmployeeBankModel({
        userId,
        emp_code,
        panNumber,
        aadharNumber,
        bankName: cleanNA(payload.bankNameBranch),
        personalAccountNumber: cleanNA(payload.accountNumber),
        personalIfsc: cleanNA(payload.ifscCode)
      });
      await bank.save();

      const grossStr = cleanNA(payload.gross);
      const ctcStr = cleanNA(payload.ctc);

      const payroll = new EmployeePayrollModel({
        userId,
        emp_code,
        gross: grossStr ? Number(grossStr) : undefined,
        ctc: ctcStr ? Number(ctcStr) : undefined,
        pf: payload.pfApplicable || false,
        esic: payload.esicApplicable || false,
        pt: payload.ptApplicable || false
      });
      await payroll.save();
    }

    res.status(201).json({ message: 'Employee added successfully', emp_code });

  } catch (error) {
    console.error('Create Employee Error:', error);
    // If validation error from mongoose, handle nicely
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map(v => v.message).join(', ');
      return res.status(400).json({ message: 'Validation failed: ' + msgs });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
