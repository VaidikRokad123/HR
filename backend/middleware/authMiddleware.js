import { verifyToken } from '../utils/jwtUtils.js';
import UserModel from '../models/UserModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import { getEffectiveAccess, hasPermission, PERMISSIONS, ROLES } from '../config/rbac.js';

export const auth = async (req, res, next) => {
  try {
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

    const user = await UserModel.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const professional = await EmployeeProfessionalModel.findOne({ userId: user._id });
    const access = getEffectiveAccess({ user, professional });

    req.user = {
      userId: user._id,
      role: access.role,
      storedRole: access.storedRole,
      emp_code: user.emp_code,
      status: user.status,
      department: access.department,
      jobTitle: access.jobTitle,
      permissions: access.permissions,
      isViewOnly: access.isViewOnly,
      canReadHr: access.canReadHr,
      canWriteHr: access.canWriteHr
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!hasPermission(req.user, permission)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  next();
};

export const hrOnly = (req, res, next) => {
  if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
    return res.status(403).json({ message: 'Access denied. HR only.' });
  }

  next();
};

export const hrSeniorOnly = (req, res, next) => {
  if (!hasPermission(req.user, PERMISSIONS.HR_READ)) {
    return res.status(403).json({ message: 'Access denied. HR only.' });
  }

  if (!hasPermission(req.user, PERMISSIONS.HR_WRITE)) {
    return res.status(403).json({
      message: 'Access denied. This action requires Senior HR privileges.',
      permissionLevel: 'view-only'
    });
  }

  next();
};

export const employeeOnly = (req, res, next) => {
  if (req.user.role !== ROLES.EMPLOYEE && req.user.role !== ROLES.HR) {
    return res.status(403).json({ message: 'Access denied. Employee only.' });
  }

  next();
};
