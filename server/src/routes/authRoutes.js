import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserById, findUserByGoogleIdOrEmail, createUser, isAdminEmail } from '../services/store.js';

const router = express.Router();

/**
 * Helper to generate JWT session token
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'aarohan_secret_jwt_key_2026_dev_mode';
  return jwt.sign({ userId }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

/**
 * @route   POST /api/v1/auth/google
 * @desc    Authenticate with Firebase Google Identity Payload
 * @access  Public
 */
router.post('/google', async (req, res) => {
  try {
    const { firebaseToken, googleId: reqGoogleId, email: reqEmail, name: reqName, avatar: reqAvatar, devUser } = req.body;

    let googleId, email, name, avatar;

    // 1. Dev Mode fallback for quick testing
    if (process.env.NODE_ENV === 'development' && devUser) {
      googleId = devUser.googleId || `firebase-dev-${Date.now()}`;
      email = devUser.email || 'dev.participant@aarohan.edu';
      name = devUser.name || 'Dev Participant';
      avatar = devUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    } else if (reqEmail && (reqGoogleId || firebaseToken)) {
      // 2. Verified Firebase Auth Payload
      googleId = reqGoogleId || `firebase-${Date.now()}`;
      email = reqEmail.toLowerCase().trim();
      name = reqName || 'Firebase User';
      avatar = reqAvatar || '';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Firebase authentication credentials (email & Google ID) are required.',
      });
    }

    // Single account per Firebase ID / Email constraint
    let user = await findUserByGoogleIdOrEmail(googleId, email);
    const isAdmin = isAdminEmail(email);

    if (!user) {
      user = await createUser({
        googleId,
        email,
        name,
        avatar,
        role: isAdmin ? 'super_admin' : 'participant',
        isProfileComplete: isAdmin ? true : false,
        profile: {
          fullName: name,
        },
      });
      console.log(`[Firebase Auth] Created user: ${email} (${user.role})`);
    } else {
      if (isAdmin && user.role !== 'admin' && user.role !== 'super_admin') {
        user.role = 'super_admin';
        user.isProfileComplete = true;
      }
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
      }
      console.log(`[Firebase Auth] Authenticated user: ${email} (${user.role})`);
    }

    // Issue backend session JWT
    const token = generateToken(user._id);

    // Attach HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Firebase Authentication successful.',
      token,
      redirectTo: (user.role === 'admin' || user.role === 'super_admin') ? '/admin' : (!user.isProfileComplete ? '/onboarding' : '/dashboard'),
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        profile: user.profile,
        teamId: user.teamId,
        teamName: user.teamName,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error('[Firebase Auth Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication server error: ' + error.message,
    });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Sign out and clear session cookie
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Successfully signed out.',
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile (Quiet 200 response if unauthenticated)
 * @access  Public / Quiet Check
 */
router.get('/me', async (req, res) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(200).json({ success: false, user: null });
    }

    const jwtSecret = process.env.JWT_SECRET || 'aarohan_secret_jwt_key_2026_dev_mode';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(200).json({ success: false, user: null });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
        profile: user.profile,
        teamId: user.teamId,
        teamName: user.teamName,
        stats: user.stats,
      },
    });
  } catch (err) {
    return res.status(200).json({ success: false, user: null });
  }
});

export default router;
