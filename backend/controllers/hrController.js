import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
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
import { hasPermission, PERMISSIONS, ROLES } from '../config/rbac.js';
import { sendEmail } from '../utils/emailUtils.js';

// @desc    Get all pending employee registrations
// @route   GET /api/Human Resources/pending-employees
// @access  Private (HR)
export const getPendingEmployees = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }

    const pendingUsers = await UserModel.find({ status: 'pending_hr' }).select('-passwordHash');

    const pendingEmployees = await Promise.all(
      pendingUsers.map(async (user) => {
        const personal = await EmployeePersonalModel.findOne({ userId: user._id });
        const family = await EmployeeFamilyModel.findOne({ userId: user._id });
        const address = await EmployeeAddressModel.findOne({ userId: user._id });
        const emergency = await EmployeeEmergencyModel.findOne({ userId: user._id });

        return {
          user: {
            id: user._id,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt
          },
          personal,
          family,
          address,
          emergency
        };
      })
    );

    res.json(pendingEmployees);

  } catch (error) {
    console.error('Get pending employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get full employee details
// @route   GET /api/Human Resources/employee/:id
// @access  Private (HR)
export const getEmployeeById = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }

    const user = await UserModel.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const personal = await EmployeePersonalModel.findOne({ userId: user._id });
    const family = await EmployeeFamilyModel.findOne({ userId: user._id });
    const address = await EmployeeAddressModel.findOne({ userId: user._id });
    const emergency = await EmployeeEmergencyModel.findOne({ userId: user._id });

    let professional = null;
    let bank = null;
    let payroll = null;

    if (user.emp_code) {
      professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
      bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
      payroll = await EmployeePayrollModel.findOne({ emp_code: user.emp_code });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emp_code: user.emp_code,
        status: user.status,
        createdAt: user.createdAt
      },
      personal,
      family,
      address,
      emergency,
      professional,
      bank,
      payroll
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve employee and assign professional details
// @route   PUT /api/Human Resources/employee/:id/approve
// @access  Private (HR)
export const approveEmployee = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }
    if (!hasPermission(req.user, PERMISSIONS.HR_WRITE)) {
      return res.status(403).json({ message: 'Access denied. This action requires Senior HR privileges.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (user.status !== 'pending_hr') {
      return res.status(400).json({ message: 'Employee is not in pending status' });
    }

    // Generate unique emp_code
    const emp_code = await generateEmpCode();

    // Update user
    user.emp_code = emp_code;
    user.status = 'approved';
    if (req.body.workEmail) {
      user.email = req.body.workEmail.toLowerCase().trim();
    }
    await user.save();

    // Update all employee records with emp_code
    await EmployeePersonalModel.updateOne({ userId: user._id }, { emp_code });
    await EmployeeFamilyModel.updateOne({ userId: user._id }, { emp_code });
    await EmployeeAddressModel.updateOne({ userId: user._id }, { emp_code });
    await EmployeeEmergencyModel.updateOne({ userId: user._id }, { emp_code });

    // Create professional record
    const {
      dateJoined,
      department,
      jobTitle,
      employmentType,
      reportingManager,
      workEmail,
      attendanceBiometricId,
      inProbation,
      probationDuration
    } = req.body;

    const professional = new EmployeeProfessionalModel({
      userId: user._id,
      emp_code,
      dateJoined,
      department,
      jobTitle,
      employmentType,
      reportingManager,
      workEmail,
      attendanceBiometricId,
      inProbation: inProbation !== undefined ? inProbation : true,
      probationDuration,
      probationEndedNotified: false
    });

    await professional.save();

    // Create notification for employee
    const notification = new NotificationModel({
      toRole: 'employee',
      toUserId: user._id,
      toEmpCode: emp_code,
      message: `Your profile has been approved! Your employee code is ${emp_code}. Your company email for login is ${user.email}. Please complete your bank details and LinkedIn URL.`
    });
    await notification.save();

    res.json({
      message: 'Employee approved successfully',
      emp_code,
      professional
    });

  } catch (error) {
    console.error('Approve employee error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject employee registration
// @route   PUT /api/Human Resources/employee/:id/reject
// @access  Private (HR)
export const rejectEmployee = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }
    if (!hasPermission(req.user, PERMISSIONS.HR_WRITE)) {
      return res.status(403).json({ message: 'Access denied. This action requires Senior HR privileges.' });
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (user.status !== 'pending_hr') {
      return res.status(400).json({ message: 'Employee is not in pending status' });
    }

    // Delete all related records
    await EmployeePersonalModel.deleteOne({ userId: user._id });
    await EmployeeFamilyModel.deleteOne({ userId: user._id });
    await EmployeeAddressModel.deleteOne({ userId: user._id });
    await EmployeeEmergencyModel.deleteOne({ userId: user._id });

    // Delete user
    await UserModel.deleteOne({ _id: user._id });

    res.json({ message: 'Employee registration rejected and deleted' });

  } catch (error) {
    console.error('Reject employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Edit employee details (any module)
// @route   PUT /api/Human Resources/employee/:id/edit
// @access  Private (HR)
export const editEmployee = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }
    if (!hasPermission(req.user, PERMISSIONS.HR_WRITE)) {
      return res.status(403).json({ message: 'Access denied. This action requires Senior HR privileges.' });
    }

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
        if (!user.emp_code) {
          return res.status(400).json({ message: 'Employee not approved yet' });
        }

        // Validate probation duration if present
        if (data.probationDuration) {
          const duration = parseInt(data.probationDuration, 10);
          if (isNaN(duration) || duration < 0 || duration > 12) {
            return res.status(400).json({ message: 'Probation duration must be a number between 0 and 12 months.' });
          }
        }

        // Reset notification flag if HR updates probation duration
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
        if (!user.emp_code) {
          return res.status(400).json({ message: 'Employee not approved yet' });
        }
        updated = await EmployeeBankModel.findOneAndUpdate(
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
// @route   GET /api/Human Resources/all-employees
// @access  Private (HR)
export const getAllEmployees = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }

    const approvedUsers = await UserModel.find({ status: 'approved' }).select('-passwordHash');

    const employees = await Promise.all(
      approvedUsers.map(async (user) => {
        const personal = await EmployeePersonalModel.findOne({ emp_code: user.emp_code });
        const professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
        const family = await EmployeeFamilyModel.findOne({ emp_code: user.emp_code });
        const address = await EmployeeAddressModel.findOne({ emp_code: user.emp_code });
        const emergency = await EmployeeEmergencyModel.findOne({ emp_code: user.emp_code });
        const bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
        const payroll = await EmployeePayrollModel.findOne({ emp_code: user.emp_code });

        // Check if probation has ended and notify HR
        if (professional && professional.inProbation && professional.probationDuration && professional.dateJoined) {
          const months = parseInt(professional.probationDuration, 10);

          if (!isNaN(months) && !professional.probationEndedNotified) {
            const probationEndDate = new Date(professional.dateJoined);
            probationEndDate.setMonth(probationEndDate.getMonth() + months);

            if (new Date() >= probationEndDate) {
              const notification = new NotificationModel({
                toRole: ROLES.HR,
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
            status: user.status,
            createdAt: user.createdAt
          },
          personal,
          professional,
          family,
          address,
          emergency,
          bank,
          payroll
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
// @route   GET /api/Human Resources/pending-payrolls
// @access  Private (HR)
export const getPendingPayrolls = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }

    // Every approved employee with professional details but no payroll record
    // belongs in Pending Payrolls until HR saves payroll details.
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
// @route   POST /api/Human Resources/payroll/:id
// @access  Private (HR)
export const addPayrollDetails = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }
    if (!hasPermission(req.user, PERMISSIONS.HR_WRITE)) {
      return res.status(403).json({ message: 'Access denied. This action requires Senior HR privileges.' });
    }

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
      tds: tds || false
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
// @route   POST /api/Human Resources/bulk-upload
// @access  Private (HR)
export const bulkUploadEmployees = async (req, res) => {
  try {
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }
    if (!hasPermission(req.user, PERMISSIONS.HR_WRITE)) {
      return res.status(403).json({ message: 'Access denied. This action requires Senior HR privileges.' });
    }

    const { employees } = req.body;
    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ message: 'Invalid data format. Expected an array of employees.' });
    }

    const createdUsers = [];
    const errors = [];

    // Default password for bulk uploaded users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Welcome@123', salt);

    for (const [index, empData] of employees.entries()) {
      try {
        let { user: userData, personal, professional, family, address, bank, emergency } = empData;

        let email = userData?.email || personal?.personalEmail || `temp${Date.now()}@example.com`;
        email = email.toLowerCase().trim();
        const empCodeFromSheet = empData.emp_code;

        // Check if user exists by email or emp_code
        let user = await UserModel.findOne({ email });
        if (!user && empCodeFromSheet) {
          user = await UserModel.findOne({ emp_code: empCodeFromSheet });
        }

        let isUpdate = false;
        if (user) {
          isUpdate = true;
          // Ensure existing user is approved and has an employee code
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
            passwordHash,
            role: ROLES.EMPLOYEE,
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

// @desc    Get upcoming events
// @route   GET /api/Human Resources/upcoming-events
// @access  Private (HR)
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
          events.birthdays.push({
            ...base,
            dob: nextBirthday,
            daysLeft
          });
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
          events.probation.push({
            ...base,
            probationEndDate,
            daysLeft
          });
        }
      }

      if (professional && !isCompleteEmployeeProfile(bank, professional)) {
        const approvedAt = professional.createdAt || user.createdAt;
        const daysSinceApproval = daysBetween(approvedAt, today);

        if (daysSinceApproval >= 3) {
          events.incompleteProfiles.push({
            ...base,
            approvedAt,
            daysSinceApproval
          });
        }
      }

      if (professional?.dateJoined && !professional.exitDate && !payroll) {
        const daysSinceJoining = daysBetween(professional.dateJoined, today);

        if (daysSinceJoining >= 7) {
          events.payrollPending.push({
            ...base,
            dateJoined: professional.dateJoined,
            daysSinceJoining
          });
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
          <p style="margin: 6px 0 0;">Generated from HRMS for the next 7 days and pending HR actions.</p>
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

export const sendUpcomingEventsEmailToHr = async () => {
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
    if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
      return res.status(403).json({ message: 'Access denied. HR only.' });
    }

    const events = await collectUpcomingEvents();
    res.json(events);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
