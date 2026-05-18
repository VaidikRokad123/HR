import { validationResult } from 'express-validator';
import crypto from 'crypto';
import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import EmployeeBankModel from '../models/EmployeeBankModel.js';
import EmployeePayrollModel from '../models/EmployeePayrollModel.js';
import NotificationModel from '../models/NotificationModel.js';
import { generateEmpCode } from '../utils/empCodeUtils.js';
import { sendEmail } from '../utils/emailUtils.js';

const sensitiveOtpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const getAdminEmail = () =>
  process.env.ADMIN_EMAIL ||
  process.env.HR_EMAIL ||
  process.env.EMAIL_CLIENT_MAIL ||
  process.env.EMAIL_USER;

const maskEmail = (email = '') => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
};

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const findBankAndPayroll = async (user) => {
  const bankQuery = user.emp_code
    ? { $or: [{ userId: user._id }, { emp_code: user.emp_code }] }
    : { userId: user._id };
  const payrollQuery = user.emp_code
    ? { $or: [{ userId: user._id }, { emp_code: user.emp_code }] }
    : { userId: user._id };

  return Promise.all([
    EmployeeBankModel.findOne(bankQuery),
    EmployeePayrollModel.findOne(payrollQuery)
  ]);
};

const buildSensitiveOtpEmail = ({ otp, employeeName, empCode }) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
    <div style="background: #111827; color: #fff; padding: 18px 22px;">
      <h2 style="margin: 0;">Sensitive Details Access OTP</h2>
    </div>
    <div style="padding: 22px; color: #111827;">
      <p>Use this OTP to view bank and payroll details for <strong>${employeeName || empCode || 'the employee'}</strong>.</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 18px 0;">${otp}</div>
      <p style="color: #6b7280;">This OTP expires in 10 minutes. Do not share it outside authorized HR/admin access.</p>
    </div>
  </div>
`;

const isFilledValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return value !== undefined && value !== null && value !== '';
};

const getNestedValue = (source, path) => path.split('.').reduce((current, key) => current?.[key], source);

const countFilledFields = (source, fields) =>
  fields.reduce((count, path) => count + (isFilledValue(getNestedValue(source, path)) ? 1 : 0), 0);

const buildCompletionSnapshot = (data) => {
  const sections = [
    {
      key: 'personal',
      label: 'Personal',
      fields: ['personal.fullName', 'personal.gender', 'personal.dob', 'personal.mobile', 'personal.personalEmail', 'personal.bloodGroup']
    },
    {
      key: 'family',
      label: 'Family',
      fields: ['family.fatherName', 'family.motherName', 'family.maritalStatus', 'family.spouseName', 'family.marriageDate']
    },
    {
      key: 'address',
      label: 'Address',
      fields: [
        'address.currentAddress.street',
        'address.currentAddress.city',
        'address.currentAddress.state',
        'address.currentAddress.pincode',
        'address.permanentAddress.street',
        'address.permanentAddress.city',
        'address.permanentAddress.state',
        'address.permanentAddress.pincode'
      ]
    },
    {
      key: 'emergency',
      label: 'Emergency',
      fields: ['emergency.emergencyContact1.name', 'emergency.emergencyContact1.relationship', 'emergency.emergencyContact1.mobile']
    },
    {
      key: 'professional',
      label: 'Professional',
      fields: ['professional.dateJoined', 'professional.department', 'professional.jobTitle', 'professional.employmentType', 'professional.reportingManager', 'professional.workEmail']
    },
    {
      key: 'bank',
      label: 'Bank',
      fields: [
        'bank.companyOpensBank',
        'bank.panNumber',
        'bank.aadharNumber',
        'bank.permissionToUsePanAadhar',
        'bank.bankName',
        'bank.accountHolderName',
        'bank.branch',
        'bank.personalAccountNumber',
        'bank.personalIfsc',
        'bank.salaryAccountNumber',
        'bank.salaryIfsc'
      ]
    },
    {
      key: 'payroll',
      label: 'Payroll',
      fields: ['payroll.ctc', 'payroll.gross', 'payroll.pf', 'payroll.pt', 'payroll.esic', 'payroll.tds']
    }
  ];

  const sectionProgress = sections.map((section) => {
    const filledFields = countFilledFields(data, section.fields);
    const percentage = section.fields.length ? Math.round((filledFields / section.fields.length) * 100) : 0;

    return {
      key: section.key,
      label: section.label,
      percentage,
      filledFields,
      totalFields: section.fields.length
    };
  });

  const totalFields = sectionProgress.reduce((total, section) => total + section.totalFields, 0);
  const filledFields = sectionProgress.reduce((total, section) => total + section.filledFields, 0);
  const completionPercentage = totalFields ? Math.round((filledFields / totalFields) * 100) : 0;
  const missingSections = sectionProgress.filter((section) => section.percentage < 100).map((section) => section.label);

  return {
    completionPercentage,
    filledFields,
    totalFields,
    missingSections,
    sectionProgress
  };
};

const normalizeEmployeeStatus = async (user) => {
  if (!user || user.status === 'approved') {
    return 'approved';
  }

  user.status = 'approved';
  await user.save();
  return 'approved';
};

// @desc    Get full employee details
// @route   GET /api/employees/:id
// @access  Private (Admin)
export const getEmployeeById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const [personal, family, address, emergency, professional] = await Promise.all([
      EmployeePersonalModel.findOne({ userId: user._id }),
      EmployeeFamilyModel.findOne({ userId: user._id }),
      EmployeeAddressModel.findOne({ userId: user._id }),
      EmployeeEmergencyModel.findOne({ userId: user._id }),
      user.emp_code
        ? EmployeeProfessionalModel.findOne({ $or: [{ userId: user._id }, { emp_code: user.emp_code }] })
        : EmployeeProfessionalModel.findOne({ userId: user._id }),
    ]);

    const [bank, payroll] = await findBankAndPayroll(user);
    const completion = buildCompletionSnapshot({ user, personal, family, address, emergency, professional, bank, payroll });
    const status = await normalizeEmployeeStatus(user);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        emp_code: user.emp_code,
        status,
        pendingSections: user.pendingSections || [],
        createdAt: user.createdAt
      },
      personal,
      family,
      address,
      emergency,
      professional,
      bank: null,
      payroll: null,
      sensitiveDetailsLocked: true,
      hasBankDetails: Boolean(bank),
      hasPayrollDetails: Boolean(payroll),
      completionPercentage: completion.completionPercentage,
      filledFields: completion.filledFields,
      totalFields: completion.totalFields,
      missingSections: completion.missingSections,
      sectionProgress: completion.sectionProgress
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send OTP to admin email for sensitive bank/payroll access
// @route   POST /api/employees/:id/sensitive-otp
// @access  Private (Admin)
export const requestSensitiveDetailsOtp = async (req, res) => {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      return res.status(500).json({ message: 'Admin email is not configured. Set ADMIN_EMAIL or HR_EMAIL.' });
    }

    const user = await UserModel.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const personal = await EmployeePersonalModel.findOne({ userId: user._id });
    const otp = String(crypto.randomInt(100000, 1000000));
    sensitiveOtpStore.set(String(user._id), {
      hash: hashOtp(otp),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0
    });

    await sendEmail(
      adminEmail,
      `HRMS OTP for sensitive employee details`,
      buildSensitiveOtpEmail({
        otp,
        employeeName: personal?.fullName,
        empCode: user.emp_code
      })
    );

    res.json({
      message: `OTP sent to ${maskEmail(adminEmail)}`,
      email: maskEmail(adminEmail)
    });
  } catch (error) {
    console.error('Request sensitive OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

// @desc    Verify OTP and return sensitive bank/payroll details
// @route   POST /api/employees/:id/sensitive-verify
// @access  Private (Admin)
export const verifySensitiveDetailsOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await UserModel.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const key = String(user._id);
    const record = sensitiveOtpStore.get(key);
    if (!record) {
      return res.status(400).json({ message: 'Please request a new OTP' });
    }

    if (record.expiresAt < Date.now()) {
      sensitiveOtpStore.delete(key);
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP' });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      sensitiveOtpStore.delete(key);
      return res.status(400).json({ message: 'Too many invalid attempts. Please request a new OTP' });
    }

    if (record.hash !== hashOtp(otp)) {
      record.attempts += 1;
      sensitiveOtpStore.set(key, record);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    sensitiveOtpStore.delete(key);
    const [bank, payroll] = await findBankAndPayroll(user);

    res.json({
      message: 'Sensitive details unlocked',
      bank,
      payroll
    });
  } catch (error) {
    console.error('Verify sensitive OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// @desc    Edit employee details (any module)
// @route   PUT /api/employees/:id/edit
// @access  Private (Admin)
export const editEmployee = async (req, res) => {
  try {
    const { module, data } = req.body;

    if (!module || !data) {
      return res.status(400).json({ message: 'Module and data are required' });
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let updated;

    switch (module) {
      case 'personal':
        updated = await EmployeePersonalModel.findOneAndUpdate(
          { userId: user._id },
          data,
          { new: true, runValidators: true }
        );
        break;

      case 'family':
        updated = await EmployeeFamilyModel.findOneAndUpdate(
          { userId: user._id },
          data,
          { new: true, runValidators: true }
        );
        break;

      case 'address':
        updated = await EmployeeAddressModel.findOneAndUpdate(
          { userId: user._id },
          data,
          { new: true, runValidators: true }
        );
        break;

      case 'emergency':
        updated = await EmployeeEmergencyModel.findOneAndUpdate(
          { userId: user._id },
          data,
          { new: true, runValidators: true }
        );
        break;

      case 'professional':


        if (data.probationDuration) {
          const duration = parseInt(data.probationDuration, 10);
          if (isNaN(duration) || duration < 0 || duration > 12) {
            return res.status(400).json({ message: 'Probation duration must be a number between 0 and 12 months.' });
          }
        }

        if (data.inProbation && data.probationDuration) {
          data.probationEndedNotified = false;
        }

        updated = await EmployeeProfessionalModel.findOneAndUpdate(
          { emp_code: user.emp_code },
          data,
          { new: true, runValidators: true }
        );
        break;

      case 'bank':

        updated = await EmployeeBankModel.findOneAndUpdate(
          { emp_code: user.emp_code },
          data,
          { new: true, runValidators: true, upsert: true }
        );
        break;

      case 'payroll':

        
        const currentPayroll = await EmployeePayrollModel.findOne({ emp_code: user.emp_code });
        if (currentPayroll) {
          const hasChanges = ['ctc', 'gross', 'pf', 'pt', 'esic', 'tds'].some(key => {
            if (data[key] === undefined) return false;
            return String(data[key]) !== String(currentPayroll[key]);
          });
          
          if (hasChanges) {
            data.$push = {
              history: {
                ctc: data.ctc !== undefined ? data.ctc : currentPayroll.ctc,
                gross: data.gross !== undefined ? data.gross : currentPayroll.gross,
                pf: data.pf !== undefined ? data.pf : currentPayroll.pf,
                pt: data.pt !== undefined ? data.pt : currentPayroll.pt,
                esic: data.esic !== undefined ? data.esic : currentPayroll.esic,
                tds: data.tds !== undefined ? data.tds : currentPayroll.tds,
                updatedAt: new Date(),
                changeType: 'updated by admin'
              }
            };
          }
        } else {
          data.$push = {
            history: {
              ctc: data.ctc,
              gross: data.gross,
              pf: data.pf,
              pt: data.pt,
              esic: data.esic,
              tds: data.tds,
              updatedAt: new Date(),
              changeType: 'initial setup'
            }
          };
        }

        updated = await EmployeePayrollModel.findOneAndUpdate(
          { emp_code: user.emp_code },
          data,
          { new: true, runValidators: true, upsert: true }
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid module name' });
    }

    res.json({
      message: `${module} details updated successfully`,
      data: updated
    });

  } catch (error) {
    console.error('Edit employee error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all approved employees
// @route   GET /api/employees/all
// @access  Private (Admin)
export const getAllEmployees = async (req, res) => {
  try {
    const users = await UserModel.find({ status: { $ne: 'rejected' } }).select('-passwordHash');

    const employees = await Promise.all(
      users.map(async (user) => {
        const status = await normalizeEmployeeStatus(user);
        const personal = await EmployeePersonalModel.findOne({ emp_code: user.emp_code });
        const professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
        const family = await EmployeeFamilyModel.findOne({ emp_code: user.emp_code });
        const address = await EmployeeAddressModel.findOne({ emp_code: user.emp_code });
        const emergency = await EmployeeEmergencyModel.findOne({ emp_code: user.emp_code });
        const bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
        const payroll = await EmployeePayrollModel.findOne({ emp_code: user.emp_code });
        const completion = buildCompletionSnapshot({ user, personal, family, address, emergency, professional, bank, payroll });

        if (professional && professional.inProbation && professional.probationDuration && professional.dateJoined) {
          const months = parseInt(professional.probationDuration, 10);

          if (!isNaN(months) && !professional.probationEndedNotified) {
            const probationEndDate = new Date(professional.dateJoined);
            probationEndDate.setMonth(probationEndDate.getMonth() + months);

            if (new Date() >= probationEndDate) {
              const notification = new NotificationModel({
                toRole: 'admin',
                message: `Probation period has ended for ${personal?.fullName || user.email} (${user.emp_code}). Please review their status.`
              });
              await notification.save();

              professional.probationEndedNotified = true;
              await professional.save();
            }
          }
        }

        return {
          user: {
            id: user._id,
            email: user.email,
            emp_code: user.emp_code,
            status,
            createdAt: user.createdAt
          },
          personal,
          professional,
          family,
          address,
          emergency,
          bank: null,
          payroll: null,
          sensitiveDetailsLocked: true,
          hasBankDetails: Boolean(bank),
          hasPayrollDetails: Boolean(payroll),
          completionPercentage: completion.completionPercentage,
          filledFields: completion.filledFields,
          totalFields: completion.totalFields,
          missingSections: completion.missingSections,
          sectionProgress: completion.sectionProgress
        };
      })
    );

    res.json(employees);

  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get employees pending payroll details
// @route   GET /api/employees/pending-payrolls
// @access  Private (Admin)
export const getPendingPayrolls = async (req, res) => {
  try {
    const professionals = await EmployeeProfessionalModel.find({
      emp_code: { $exists: true, $ne: null },
      exitDate: { $eq: null }
    });

    const pendingPayrolls = [];

    for (const prof of professionals) {
      const existingPayroll = await EmployeePayrollModel.findOne({ emp_code: prof.emp_code });
      if (!existingPayroll) {
        const user = await UserModel.findOne({
          _id: prof.userId,
          status: 'approved',
          emp_code: prof.emp_code
        }).select('email status createdAt emp_code');

        if (!user) continue;

        const personal = await EmployeePersonalModel.findOne({ userId: prof.userId }).select('fullName mobile');

        pendingPayrolls.push({
          user: {
            id: prof.userId,
            email: user?.email,
            emp_code: prof.emp_code,
            dateJoined: prof.dateJoined
          },
          personal,
          professional: {
            department: prof.department,
            jobTitle: prof.jobTitle,
            employmentType: prof.employmentType,
            workEmail: prof.workEmail
          }
        });
      }
    }

    pendingPayrolls.sort((a, b) => new Date(a.user.dateJoined) - new Date(b.user.dateJoined));

    res.json(pendingPayrolls);
  } catch (error) {
    console.error('Get pending payrolls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add payroll details for an employee
// @route   POST /api/employees/payroll/:id
// @access  Private (Admin)
export const addPayrollDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { ctc, gross, pf, pt, esic, tds } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const professional = await EmployeeProfessionalModel.findOne({ userId });
    if (!professional) {
      return res.status(400).json({ message: 'Professional details not found for this employee' });
    }

    const existingPayroll = await EmployeePayrollModel.findOne({ userId });
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll details already exist for this employee' });
    }

    const newPayroll = new EmployeePayrollModel({
      userId,
      emp_code: user.emp_code,
      ctc,
      gross,
      pf: pf || false,
      pt: pt || false,
      esic: esic || false,
      tds: tds || false,
      history: [{
        ctc,
        gross,
        pf: pf || false,
        pt: pt || false,
        esic: esic || false,
        tds: tds || false,
        changeType: 'initial setup',
        updatedAt: new Date()
      }]
    });

    await newPayroll.save();

    res.status(201).json({ message: 'Payroll details added successfully', payroll: newPayroll });

  } catch (error) {
    console.error('Add payroll details error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Bulk upload employees from excel data
// @route   POST /api/employees/bulk-upload
// @access  Private (Admin)
export const bulkUploadEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ message: 'Invalid data format. Expected an array of employees.' });
    }

    const createdUsers = [];
    const errors = [];

    for (const [index, empData] of employees.entries()) {
      try {
        let { user: userData, personal, professional, family, address, bank, emergency } = empData;

        let email = userData?.email || personal?.personalEmail || `temp${Date.now()}@example.com`;
        email = email.toLowerCase().trim();
        const empCodeFromSheet = empData.emp_code;

        let user = await UserModel.findOne({ email });
        if (!user && empCodeFromSheet) {
          user = await UserModel.findOne({ emp_code: empCodeFromSheet });
        }

        let isUpdate = false;
        if (user) {
          isUpdate = true;
          let userNeedsUpdate = false;
          if (user.status !== 'approved') {
            user.status = 'approved';
            userNeedsUpdate = true;
          }
          if (!user.emp_code) {
            user.emp_code = empCodeFromSheet || await generateEmpCode();
            userNeedsUpdate = true;
          }
          if (userNeedsUpdate) await user.save();
        } else {
          const emp_code = empCodeFromSheet || await generateEmpCode();

          user = new UserModel({
            email,
            status: 'approved',
            emp_code
          });

          await user.save();
        }

        const current_emp_code = user.emp_code;

        if (personal) {
          if (isUpdate) await EmployeePersonalModel.findOneAndUpdate({ userId: user._id }, { emp_code: current_emp_code, ...personal }, { upsert: true, runValidators: true });
          else await new EmployeePersonalModel({ userId: user._id, emp_code: current_emp_code, ...personal }).save();
        }

        if (professional) {
          if (isUpdate) await EmployeeProfessionalModel.findOneAndUpdate({ userId: user._id }, { emp_code: current_emp_code, ...professional }, { upsert: true, runValidators: true });
          else await new EmployeeProfessionalModel({ userId: user._id, emp_code: current_emp_code, ...professional }).save();
        }

        if (family) {
          if (isUpdate) await EmployeeFamilyModel.findOneAndUpdate({ userId: user._id }, { emp_code: current_emp_code, ...family }, { upsert: true, runValidators: true });
          else await new EmployeeFamilyModel({ userId: user._id, emp_code: current_emp_code, ...family }).save();
        }

        if (address) {
          if (isUpdate) await EmployeeAddressModel.findOneAndUpdate({ userId: user._id }, { emp_code: current_emp_code, ...address }, { upsert: true, runValidators: true });
          else await new EmployeeAddressModel({ userId: user._id, emp_code: current_emp_code, ...address }).save();
        }

        if (bank) {
          if (isUpdate) await EmployeeBankModel.findOneAndUpdate({ emp_code: current_emp_code }, { userId: user._id, ...bank }, { upsert: true, runValidators: true });
          else await new EmployeeBankModel({ userId: user._id, emp_code: current_emp_code, ...bank }).save();
        }

        if (emergency) {
          if (isUpdate) await EmployeeEmergencyModel.findOneAndUpdate({ userId: user._id }, { emp_code: current_emp_code, ...emergency }, { upsert: true, runValidators: true });
          else await new EmployeeEmergencyModel({ userId: user._id, emp_code: current_emp_code, ...emergency }).save();
        }

        createdUsers.push({ email, emp_code: current_emp_code, isUpdate });

      } catch (err) {
        console.error(`Error processing row ${index}:`, err);
        errors.push({ index, message: err.message });
      }
    }

    res.status(200).json({
      message: 'Bulk upload completed',
      successCount: createdUsers.length,
      errorCount: errors.length,
      createdUsers,
      errors
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Server error during bulk upload' });
  }
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (fromDate, toDate) => {
  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);
  return Math.round((to - from) / 86400000);
};

const nextAnnualDate = (sourceDate, today = new Date()) => {
  const source = new Date(sourceDate);
  const next = startOfDay(today);
  next.setMonth(source.getMonth(), source.getDate());

  if (next < startOfDay(today)) {
    next.setFullYear(next.getFullYear() + 1);
  }

  return next;
};

const isCompleteEmployeeProfile = (bank, professional) => {
  if (!professional?.linkedinUrl) return false;
  if (!bank) return false;

  if (bank.companyOpensBank) {
    return Boolean(bank.panNumber && bank.aadharNumber && bank.permissionToUsePanAadhar);
  }

  return Boolean(bank.bankName && bank.personalAccountNumber && bank.personalIfsc);
};

export const collectUpcomingEvents = async () => {
  const today = startOfDay(new Date());

  const events = {
    birthdays: [],
    anniversaries: [],
    probation: [],
    incompleteProfiles: [],
    payrollPending: []
  };

  const approvedUsers = await UserModel.find({
    status: 'approved',
    emp_code: { $exists: true, $ne: null }
  }).select('email emp_code createdAt');

  for (const user of approvedUsers) {
    const [personal, professional, bank, payroll] = await Promise.all([
      EmployeePersonalModel.findOne({ emp_code: user.emp_code }),
      EmployeeProfessionalModel.findOne({ emp_code: user.emp_code }),
      EmployeeBankModel.findOne({ emp_code: user.emp_code }),
      EmployeePayrollModel.findOne({ emp_code: user.emp_code })
    ]);

    const base = {
      userId: user._id,
      email: user.email,
      emp_code: user.emp_code,
      fullName: personal?.fullName,
      department: professional?.department,
      jobTitle: professional?.jobTitle
    };

    if (personal?.dob) {
      const nextBirthday = nextAnnualDate(personal.dob, today);
      const daysLeft = daysBetween(today, nextBirthday);

      if (daysLeft >= 0 && daysLeft <= 7) {
        events.birthdays.push({ ...base, dob: nextBirthday, daysLeft });
      }
    }

    if (professional?.dateJoined && !professional.exitDate) {
      const nextAnniversary = nextAnnualDate(professional.dateJoined, today);
      const yearsCompleted = nextAnniversary.getFullYear() - new Date(professional.dateJoined).getFullYear();
      const daysLeft = daysBetween(today, nextAnniversary);

      if (yearsCompleted > 0 && daysLeft >= 0 && daysLeft <= 7) {
        events.anniversaries.push({
          ...base,
          dateJoined: nextAnniversary,
          originalDateJoined: professional.dateJoined,
          yearsCompleted,
          daysLeft
        });
      }
    }

    if (
      professional?.inProbation &&
      professional?.dateJoined &&
      professional?.probationDuration !== undefined &&
      professional?.probationDuration !== null
    ) {
      const probationEndDate = new Date(professional.dateJoined);
      probationEndDate.setMonth(probationEndDate.getMonth() + Number(professional.probationDuration || 0));
      const daysLeft = daysBetween(today, probationEndDate);

      if (daysLeft >= 0 && daysLeft <= 7) {
        events.probation.push({ ...base, probationEndDate, daysLeft });
      }
    }

    if (professional && !isCompleteEmployeeProfile(bank, professional)) {
      const approvedAt = professional.createdAt || user.createdAt;
      const daysSinceApproval = daysBetween(approvedAt, today);

      if (daysSinceApproval >= 3) {
        events.incompleteProfiles.push({ ...base, approvedAt, daysSinceApproval });
      }
    }

    if (professional?.dateJoined && !professional.exitDate && !payroll) {
      const daysSinceJoining = daysBetween(professional.dateJoined, today);

      if (daysSinceJoining >= 7) {
        events.payrollPending.push({ ...base, dateJoined: professional.dateJoined, daysSinceJoining });
      }
    }
  }

  Object.values(events).forEach((items) => {
    items.sort((a, b) => {
      const aDays = a.daysLeft ?? a.daysSinceApproval ?? a.daysSinceJoining ?? 0;
      const bDays = b.daysLeft ?? b.daysSinceApproval ?? b.daysSinceJoining ?? 0;
      return aDays - bDays;
    });
  });

  return events;
};

const formatEventDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

const renderEventRows = (items, renderDetail) => {
  if (!items.length) {
    return '<tr><td colspan="4" style="padding: 10px; color: #777;">No items</td></tr>';
  }

  return items.map((item) => `
    <tr>
      <td style="padding: 10px; border-top: 1px solid #eee;">${item.fullName || item.email || item.emp_code}</td>
      <td style="padding: 10px; border-top: 1px solid #eee;">${item.emp_code || 'N/A'}</td>
      <td style="padding: 10px; border-top: 1px solid #eee;">${item.department || 'N/A'}</td>
      <td style="padding: 10px; border-top: 1px solid #eee;">${renderDetail(item)}</td>
    </tr>
  `).join('');
};

const renderEventSection = (title, items, renderDetail) => `
  <h3 style="margin: 24px 0 8px;">${title} (${items.length})</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <thead>
      <tr style="background: #f8f9fa;">
        <th style="text-align: left; padding: 10px;">Employee</th>
        <th style="text-align: left; padding: 10px;">Code</th>
        <th style="text-align: left; padding: 10px;">Department</th>
        <th style="text-align: left; padding: 10px;">Details</th>
      </tr>
    </thead>
    <tbody>${renderEventRows(items, renderDetail)}</tbody>
  </table>
`;

const buildUpcomingEventsEmail = (events) => {
  const total = Object.values(events).reduce((sum, items) => sum + items.length, 0);

  return {
    subject: `HRMS Upcoming Events Summary - ${total} alert(s)`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background: #f7941d; color: #fff; padding: 18px 22px;">
          <h2 style="margin: 0;">Upcoming Events Summary</h2>
          <p style="margin: 6px 0 0;">Generated from HRMS for the next 7 days and pending actions.</p>
        </div>
        <div style="padding: 22px;">
          <p><strong>Total alert(s):</strong> ${total}</p>
          ${renderEventSection('Upcoming Birthdays', events.birthdays, (item) => `${formatEventDate(item.dob)} - in ${item.daysLeft} day(s)`)}
          ${renderEventSection('Work Anniversaries', events.anniversaries, (item) => `${item.yearsCompleted} year(s) - in ${item.daysLeft} day(s)`)}
          ${renderEventSection('Probation Ending Soon', events.probation, (item) => `${formatEventDate(item.probationEndDate)} - in ${item.daysLeft} day(s)`)}
          ${renderEventSection('Incomplete Profiles', events.incompleteProfiles, (item) => `${item.daysSinceApproval} day(s) since approval`)}
          ${renderEventSection('Payroll Setup Pending', events.payrollPending, (item) => `Joined ${formatEventDate(item.dateJoined)} - ${item.daysSinceJoining} day(s) ago`)}
        </div>
      </div>
    `
  };
};

export const sendUpcomingEventsEmail = async () => {
  if (!process.env.HR_EMAIL) {
    throw new Error('HR_EMAIL is not configured in environment variables.');
  }

  const events = await collectUpcomingEvents();
  const { subject, body } = buildUpcomingEventsEmail(events);
  await sendEmail(process.env.HR_EMAIL, subject, body);
  return events;
};

export const getUpcomingEvents = async (req, res) => {
  try {
    const events = await collectUpcomingEvents();
    res.json(events);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
