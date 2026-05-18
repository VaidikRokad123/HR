import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Expected behavior for expired sessions, don't dump stack trace
      console.warn('⚠️ Token expired');
    } else {
      console.error('❌ JWT Verification Error:', error.message);
    }
    return null;
  }
};
