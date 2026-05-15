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
import { ROLES } from '../config/rbac.js';

// @desc    Check approval status
// @route   GET /api/employee/waiting-status
// @access  Private (Employee)
export const getWaitingStatus = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is complete (bank + linkedin)
    let profileComplete = false;
    if (user.status === 'approved' && user.emp_code) {
      const bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
      const professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
      
      profileComplete = bank && professional && professional.linkedinUrl;
    }

    res.json({
      status: user.status,
      emp_code: user.emp_code,
      profileComplete
    });

  } catch (error) {
    console.error('Waiting status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get employee's own profile
// @route   GET /api/employee/my-details
// @access  Private (Employee)
export const getMyDetails = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
      payroll = await EmployeePayrollModel.findOne({ emp_code: user.emp_code });
      const bankData = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
      
      // Hide salary account details from employee
      if (bankData) {
        bank = {
          companyOpensBank: bankData.companyOpensBank,
          panNumber: bankData.panNumber,
          aadharNumber: bankData.aadharNumber,
          permissionToUsePanAadhar: bankData.permissionToUsePanAadhar,
          bankName: bankData.bankName,
          branch: bankData.branch,
          personalAccountNumber: bankData.personalAccountNumber,
          personalIfsc: bankData.personalIfsc
        };
      }
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emp_code: user.emp_code,
        status: user.status
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
    console.error('Get my details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete profile with bank details and LinkedIn URL (mandatory)
// @route   PUT /api/employee/complete-profile
// @access  Private (Employee)
export const completeProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await UserModel.findById(req.user.userId);
    
    if (!user || user.status !== 'approved' || !user.emp_code) {
      return res.status(400).json({ message: 'Profile not approved yet or emp_code missing' });
    }

    // Check if profile is already complete
    const existingBank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
    const existingProfessional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
    
    if (existingBank && existingProfessional && existingProfessional.linkedinUrl) {
      return res.status(400).json({ message: 'Profile already completed. You cannot update it again.' });
    }

    const { 
      companyOpensBank, panNumber, aadharNumber, permissionToUsePanAadhar,
      bankName, branch, personalAccountNumber, personalIfsc, 
      linkedinUrl, nameAsPerAadhaar 
    } = req.body;

    // Update or create bank details
    let bank = await EmployeeBankModel.findOne({ emp_code: user.emp_code });
    
    const bankDetails = {
      companyOpensBank: !!companyOpensBank,
      panNumber: companyOpensBank ? panNumber : '',
      aadharNumber: companyOpensBank ? aadharNumber : '',
      permissionToUsePanAadhar: companyOpensBank ? !!permissionToUsePanAadhar : false,
      bankName: !companyOpensBank ? bankName : '',
      branch: !companyOpensBank ? branch : '',
      personalAccountNumber: !companyOpensBank ? personalAccountNumber : '',
      personalIfsc: !companyOpensBank ? personalIfsc : ''
    };

    if (bank) {
      Object.assign(bank, bankDetails);
      await bank.save();
    } else {
      bank = new EmployeeBankModel({
        userId: user._id,
        emp_code: user.emp_code,
        ...bankDetails
      });
      await bank.save();
    }

    // Update professional with LinkedIn URL
    const professional = await EmployeeProfessionalModel.findOne({ emp_code: user.emp_code });
    
    if (professional) {
      professional.linkedinUrl = linkedinUrl;
      if (nameAsPerAadhaar) {
        professional.nameAsPerAadhaar = nameAsPerAadhaar;
      }
      await professional.save();
    }

    // Notify HR
    const notification = new NotificationModel({
      toRole: ROLES.HR,
      message: `Employee ${user.emp_code} has completed their profile with bank details and LinkedIn URL`
    });
    await notification.save();

    res.json({
      message: 'Profile completed successfully',
      bank: {
        companyOpensBank: bank.companyOpensBank,
        bankName: bank.bankName,
        branch: bank.branch,
        personalAccountNumber: bank.personalAccountNumber,
        personalIfsc: bank.personalIfsc
      },
      linkedinUrl: professional.linkedinUrl
    });

  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
