import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import NotificationModel from '../models/NotificationModel.js';
import { generateToken } from '../utils/jwtUtils.js';

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
      role: 'employee',
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
      toRole: 'hr',
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

    // Generate JWT
    const token = generateToken({
      userId: user._id,
      role: user.role,
      emp_code: user.emp_code
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emp_code: user.emp_code,
        status: user.status
      }
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

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      emp_code: user.emp_code,
      status: user.status
    });

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
