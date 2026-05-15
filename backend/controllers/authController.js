import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import NotificationModel from '../models/NotificationModel.js';
import { generateToken } from '../utils/jwtUtils.js';
import { sendPasswordResetEmail } from '../utils/emailUtils.js';
import {
  buildUserResponse,
  DEPARTMENTS,
  DESIGNATIONS,
  EMPLOYMENT_TYPES,
  PERMISSIONS,
  ROLES
} from '../config/rbac.js';

// @desc    Employee signup (multi-step final submit)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, personal, family, address, emergency } = req.body;

    // Check if user already exists
    let user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    user = new UserModel({
      email,
      passwordHash,
      role: ROLES.EMPLOYEE,
      status: 'pending_hr'
      // Don't set emp_code - leave it undefined
    });

    await user.save();

    // Create personal details
    const employeePersonal = new EmployeePersonalModel({
      userId: user._id,
      personalEmail: email,
      ...personal
    });
    await employeePersonal.save();

    // Create family details
    const employeeFamily = new EmployeeFamilyModel({
      userId: user._id,
      ...family
    });
    await employeeFamily.save();

    // Create address details
    const employeeAddress = new EmployeeAddressModel({
      userId: user._id,
      ...address
    });
    await employeeAddress.save();

    // Create emergency contacts
    const emergencyData = {
      userId: user._id,
      emergencyContact1: emergency.emergencyContact1
    };

    // Only add emergencyContact2 if it has data
    if (emergency.emergencyContact2 && emergency.emergencyContact2.name) {
      emergencyData.emergencyContact2 = emergency.emergencyContact2;
    }

    const employeeEmergency = new EmployeeEmergencyModel(emergencyData);
    await employeeEmergency.save();

    // Create notification for HR
    const notification = new NotificationModel({
      toRole: ROLES.HR,
      message: `New employee registration: ${personal.fullName} (${email})`
    });
    await notification.save();

    res.status(201).json({
      message: 'Registration successful. Waiting for HR approval.',
      token: generateToken({
        userId: user._id,
        role: user.role,
        emp_code: user.emp_code
      }),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emp_code: user.emp_code,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const professionalDetails = await EmployeeProfessionalModel.findOne({ userId: user._id });
    const userResponse = buildUserResponse({ user, professional: professionalDetails });

    // Generate JWT
    const token = generateToken({
      userId: user._id,
      role: user.role,
      emp_code: user.emp_code
    });

    res.json({
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const professionalDetails = await EmployeeProfessionalModel.findOne({ userId: user._id });
    const userResponse = buildUserResponse({ user, professional: professionalDetails });

    res.json(userResponse);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// @desc    Get shared RBAC/reference options
// @route   GET /api/auth/rbac
// @access  Private
export const getRbacConfig = (req, res) => {
  res.json({
    roles: Object.values(ROLES),
    permissions: Object.values(PERMISSIONS),
    departments: DEPARTMENTS,
    designations: DESIGNATIONS,
    employmentTypes: EMPLOYMENT_TYPES
  });
};

// @desc    Request Password Reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // 1. Find user by company email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address.' });
    }

    // 2. Fetch personal details for name and personalEmail
    const personalDetails = await EmployeePersonalModel.findOne({ userId: user._id });
    if (!personalDetails || !personalDetails.personalEmail) {
      return res.status(400).json({ message: 'No personal email registered for this user to send OTP.' });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Set OTP and Expiry (15 mins) on User Model
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    console.log(`🔐 Generated OTP for ${email}: ${otp} (expires in 15 minutes)`);

    // 5. Send Email
    try {
      const emailSent = await sendPasswordResetEmail(
        personalDetails.personalEmail,
        personalDetails.fullName,
        otp
      );

      if (emailSent) {
        res.status(200).json({ 
          message: 'Password reset OTP has been sent to your personal email.',
          personalEmail: personalDetails.personalEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Masked email
        });
      } else {
        // Clear OTP if email failed
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.status(500).json({ 
          message: 'Failed to send email. Please check email configuration or try again later.' 
        });
      }
    } catch (emailError) {
      console.error("❌ Caught Error:", emailError);
      // Clear OTP if email sending threw an error
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        message: 'Email service error. Please contact administrator.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    // 1. Find user by email, check if OTP matches and hasn't expired
    const user = await UserModel.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 3. Update user and clear OTP fields
    user.passwordHash = passwordHash;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};
