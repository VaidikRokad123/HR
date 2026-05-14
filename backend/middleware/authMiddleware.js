import { verifyToken } from '../utils/jwtUtils.js';
import UserModel from '../models/UserModel.js';

export const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get user from database
    const user = await UserModel.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      emp_code: user.emp_code,
      status: user.status
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const hrOnly = (req, res, next) => {
  if (req.user.role !== 'hr') {
    return res.status(403).json({ message: 'Access denied. HR only.' });
  }
  next();
};

export const employeeOnly = (req, res, next) => {
  // Allow both employees and HR to access employee routes
  // HR users are also employees with complete profiles
  if (req.user.role !== 'employee' && req.user.role !== 'hr') {
    return res.status(403).json({ message: 'Access denied. Employee only.' });
  }
  next();
};
