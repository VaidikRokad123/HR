import { verifyToken } from '../utils/jwtUtils.js';
import UserModel from '../models/UserModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';

export const auth = async (req, res, next) => {
  try {
    console.log('🔒 Auth middleware - checking authentication');
    
    // Get token from header or cookie
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
      console.log('🍪 Token found in cookies');
    }

    if (!token) {
      console.warn('⚠️ No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('🎫 Token found, verifying...');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.error('❌ Token verification failed');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    console.log('✅ Token verified for user:', decoded.userId);

    // Get user from database
    const user = await UserModel.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      console.error('❌ User not found in database:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('👤 User found:', { id: user._id, role: user.role, status: user.status });

    req.user = {
      userId: user._id,
      role: user.role,
      emp_code: user.emp_code,
      status: user.status
    };

    // If user is HR, fetch their department and jobTitle from EmployeeProfessional
    if (user.role === 'hr') {
      console.log('🏢 Fetching HR professional details for RBAC...');
      const professionalDetails = await EmployeeProfessionalModel.findOne({ userId: user._id });
      
      if (professionalDetails) {
        req.user.department = professionalDetails.department;
        req.user.jobTitle = professionalDetails.jobTitle;
        console.log('✅ HR RBAC details:', { department: professionalDetails.department, jobTitle: professionalDetails.jobTitle });
      } else {
        console.warn('⚠️ No professional details found - treating as admin/root HR account');
      }
      // If no professional details found, leave department and jobTitle undefined
      // This allows root/admin HR accounts without profiles to have full access
    }

    console.log('✅ Authentication successful');
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const hrOnly = (req, res, next) => {
  console.log('🔐 HR-only middleware check');
  console.log('User role:', req.user.role);
  
  if (req.user.role !== 'hr') {
    console.warn('⚠️ Access denied - user is not HR:', req.user.role);
    return res.status(403).json({ message: 'Access denied. HR only.' });
  }
  
  console.log('✅ HR access granted');
  next();
};

export const hrSeniorOnly = (req, res, next) => {
  console.log('🔐 Senior HR-only middleware check');
  console.log('User details:', { role: req.user.role, jobTitle: req.user.jobTitle });
  
  if (req.user.role !== 'hr') {
    console.warn('⚠️ Access denied - user is not HR:', req.user.role);
    return res.status(403).json({ message: 'Access denied. HR only.' });
  }

  // If jobTitle is not set (root/admin HR without professional profile), allow access
  if (!req.user.jobTitle) {
    console.log('⚠️ HR user without jobTitle detected - granting full access (admin/root account)');
    return next();
  }

  // Block if explicitly a Jr. Human Resource Executive
  if (req.user.jobTitle === 'Jr Human Resource Executive') {
    console.warn('⚠️ Access denied - Jr HR attempting restricted action');
    return res.status(403).json({ 
      message: 'Access denied. This action requires Senior HR privileges.',
      permissionLevel: 'view-only'
    });
  }

  // Allow Sr. Human Resource Executive and other HR roles
  console.log('✅ Senior HR access granted');
  next();
};

export const employeeOnly = (req, res, next) => {
  console.log('🔐 Employee-only middleware check');
  console.log('User role:', req.user.role);
  
  // Allow both employees and HR to access employee routes
  // HR users are also employees with complete profiles
  if (req.user.role !== 'employee' && req.user.role !== 'hr') {
    console.warn('⚠️ Access denied - user is neither employee nor HR:', req.user.role);
    return res.status(403).json({ message: 'Access denied. Employee only.' });
  }
  
  console.log('✅ Employee access granted');
  next();
};
