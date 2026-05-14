import { validationResult } from 'express-validator';
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

// @desc    Get all pending employee registrations
// @route   GET /api/hr/pending-employees
// @access  Private (HR)
export const getPendingEmployees = async (req, res) => {
  try {
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
// @route   GET /api/hr/employee/:id
// @access  Private (HR)
export const getEmployeeById = async (req, res) => {
  try {
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

    if (user.emp_code) {
      professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
      bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
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
      bank
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve employee and assign professional details
// @route   PUT /api/hr/employee/:id/approve
// @access  Private (HR)
export const approveEmployee = async (req, res) => {
  try {
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
      reportingManager,
      workEmail,
      attendanceBiometricId,
      inProbation
    } = req.body;

    const professional = new EmployeeProfessionalModel({
      userId: user._id,
      emp_code,
      dateJoined,
      department,
      jobTitle,
      reportingManager,
      workEmail,
      attendanceBiometricId,
      inProbation: inProbation !== undefined ? inProbation : true
    });

    await professional.save();

    // Create notification for employee
    const notification = new NotificationModel({
      toRole: 'employee',
      toUserId: user._id,
      toEmpCode: emp_code,
      message: `Your profile has been approved! Your employee code is ${emp_code}. Please complete your bank details and LinkedIn URL.`
    });
    await notification.save();

    res.json({
      message: 'Employee approved successfully',
      emp_code,
      professional
    });

  } catch (error) {
    console.error('Approve employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject employee registration
// @route   PUT /api/hr/employee/:id/reject
// @access  Private (HR)
export const rejectEmployee = async (req, res) => {
  try {
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
// @route   PUT /api/hr/employee/:id/edit
// @access  Private (HR)
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
        if (!user.emp_code) {
          return res.status(400).json({ message: 'Employee not approved yet' });
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
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all approved employees
// @route   GET /api/hr/all-employees
// @access  Private (HR)
export const getAllEmployees = async (req, res) => {
  try {
    const approvedUsers = await UserModel.find({ status: 'approved' }).select('-passwordHash');
    
    const employees = await Promise.all(
      approvedUsers.map(async (user) => {
        const personal = await EmployeePersonalModel.findOne({ emp_code: user.emp_code });
        const professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
        const family = await EmployeeFamilyModel.findOne({ emp_code: user.emp_code });
        const address = await EmployeeAddressModel.findOne({ emp_code: user.emp_code });
        const emergency = await EmployeeEmergencyModel.findOne({ emp_code: user.emp_code });
        const bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
        
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
          bank
        };
      })
    );

    res.json(employees);

  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get employees pending payroll details (joined within 7 days)
// @route   GET /api/hr/pending-payrolls
// @access  Private (HR)
export const getPendingPayrolls = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find professional records joined within the last 7 days
    const recentProfessionals = await EmployeeProfessionalModel.find({
      dateJoined: { $gte: sevenDaysAgo }
    });

    const pendingPayrolls = [];

    for (const prof of recentProfessionals) {
      // Check if payroll already exists
      const existingPayroll = await EmployeePayrollModel.findOne({ emp_code: prof.emp_code });
      if (!existingPayroll) {
        // Find user and personal info for display
        const user = await UserModel.findById(prof.userId).select('email status createdAt');
        const personal = await EmployeePersonalModel.findOne({ userId: prof.userId }).select('fullName mobile');
        
        pendingPayrolls.push({
          user: {
            id: prof.userId,
            email: user?.email,
            emp_code: prof.emp_code,
            dateJoined: prof.dateJoined
          },
          personal
        });
      }
    }

    res.json(pendingPayrolls);
  } catch (error) {
    console.error('Get pending payrolls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add payroll details for an employee
// @route   POST /api/hr/payroll/:id
// @access  Private (HR)
export const addPayrollDetails = async (req, res) => {
  try {
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

    // Check if within 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (new Date(professional.dateJoined) < sevenDaysAgo) {
      return res.status(400).json({ message: 'Cannot add payroll details after 1 week of joining' });
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
    res.status(500).json({ message: 'Server error' });
  }
};
