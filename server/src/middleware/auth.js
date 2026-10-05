import jwt from 'jsonwebtoken';
import { findUserById } from '../services/store.js';

/**
 * Middleware to authenticate requests via JWT (Cookie or Authorization Bearer header)
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Check Authorization header if cookie not present
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'aarohan_secret_jwt_key_2026_dev_mode';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    // Attach user instance to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please sign in again.',
      error: error.message,
    });
  }
};

/**
 * Middleware to enforce profile completion before accessing protected feature routes
 */
export const requireProfileComplete = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admins bypass profile completion if needed, otherwise participants must complete profile
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }

  if (!req.user.isProfileComplete) {
    return res.status(403).json({
      success: false,
      code: 'PROFILE_INCOMPLETE',
      message: 'Profile completion is required before accessing dashboard or event rounds.',
    });
  }

  next();
};

/**
 * Middleware for strict Server-Side Role-Based Access Control (RBAC)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};
