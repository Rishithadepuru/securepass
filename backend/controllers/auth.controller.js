const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { assessRisk } = require('../middleware/riskEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'securepass_default_secret';
const JWT_EXPIRY = '24h';

// In-memory store for when MongoDB is unavailable
const mockStore = new Map();

const isMongoDB = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

// Generate a 6-digit OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Generate JWT
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

/**
 * POST /api/login
 * Accepts: { identifier, deviceInfo }
 * Returns: { riskLevel, nextStep, sessionId }
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, deviceInfo = {} } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier (email/phone) is required.' });
    }

    const normalizedId = identifier.toLowerCase().trim();

    let user;
    if (isMongoDB()) {
      user = await User.findOne({ identifier: normalizedId });
      if (!user) {
        user = new User({ identifier: normalizedId });
      }
    } else {
      user = mockStore.get(normalizedId) || {
        identifier: normalizedId,
        devices: [],
        loginHistory: [],
        totalLogins: 0,
        flaggedAttempts: 0,
        currentOtp: {},
      };
    }

    // Risk assessment
    const risk = {
  level: 'high',
  score: 90,
  factors: ['demo-test'],
  requiresOtp: true,
  requiresFace: true
};

    // Generate OTP if needed
    let otpCode = null;
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    if (risk.requiresOtp) {
      otpCode = generateOtp();
      user.currentOtp = { code: otpCode, expiresAt: otpExpiry, attempts: 0 };
      console.log(`🔑 OTP for ${normalizedId}: ${otpCode}`); // In prod, send via SMS/email
    }

    // Create session
    const sessionId = uuidv4();
    const sessionToken = signToken({ identifier: normalizedId, sessionId, riskLevel: risk.level });

    // Add device
    const deviceEntry = {
      fingerprint: deviceInfo.fingerprint || uuidv4(),
      userAgent: deviceInfo.userAgent || 'Unknown',
      platform: deviceInfo.platform || 'Unknown',
      screen: deviceInfo.screen || 'Unknown',
      language: deviceInfo.language || 'en',
      timezone: deviceInfo.timezone || 'UTC',
      trusted: false,
      lastSeen: new Date(),
      name: deviceInfo.name || `${deviceInfo.platform || 'Device'} – ${deviceInfo.browser || 'Browser'}`,
    };

    if (!user.devices) user.devices = [];
    const existingDevice = user.devices.find(d => d.fingerprint === deviceEntry.fingerprint);
    if (!existingDevice) {
      user.devices.push(deviceEntry);
    } else {
      existingDevice.lastSeen = new Date();
    }

    user.riskLevel = risk.level;
    user.sessionToken = sessionToken;

    if (isMongoDB()) {
      await user.save();
    } else {
      mockStore.set(normalizedId, user);
    }

    // Determine next step
    let nextStep = 'dashboard';
    if (risk.requiresFace) nextStep = 'otp'; // OTP first, then face
    else if (risk.requiresOtp) nextStep = 'otp';

    res.json({
      success: true,
      riskLevel: risk.level,
      riskScore: risk.score,
      riskFactors: risk.factors,
      nextStep,
      requiresOtp: risk.requiresOtp,
      requiresFace: risk.requiresFace,
      sessionToken: risk.level === 'low' ? sessionToken : null, // Only return token on low risk
      tempToken: sessionToken, // Used to continue auth flow
      identifier: normalizedId,
      // For demo: expose OTP in response (remove in production)
      ...(process.env.NODE_ENV === 'development' && otpCode ? { devOtp: otpCode } : {}),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/verify-otp
 * Accepts: { tempToken, otp }
 * Returns: { success, nextStep, sessionToken }
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { tempToken, otp, identifier } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit OTP required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }

    const normalizedId = decoded.identifier || (identifier && identifier.toLowerCase().trim());

    let user;
    if (isMongoDB()) {
      user = await User.findOne({ identifier: normalizedId });
    } else {
      user = mockStore.get(normalizedId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User session not found.' });
    }

    const storedOtp = user.currentOtp;

    // Validate OTP
    if (!storedOtp || !storedOtp.code) {
      return res.status(400).json({ success: false, message: 'No active OTP. Please login again.' });
    }

    if (storedOtp.attempts >= 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP attempts. Please restart login.' });
    }

    if (new Date() > new Date(storedOtp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (storedOtp.code !== otp) {
      user.currentOtp.attempts = (storedOtp.attempts || 0) + 1;
      if (isMongoDB()) await user.save();
      else mockStore.set(normalizedId, user);
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // OTP verified – clear it
    user.currentOtp = { code: null, expiresAt: null, attempts: 0 };

    const requiresFace = decoded.riskLevel === 'high';

    if (!requiresFace) {
      // Full auth complete
      const sessionToken = signToken({ identifier: normalizedId, sessionId: uuidv4(), verified: true });
      user.sessionToken = sessionToken;
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.unshift({
        timestamp: new Date(),
        ip: req.ip || '127.0.0.1',
        location: 'Unknown',
        device: 'Web Browser',
        riskLevel: decoded.riskLevel,
        authMethod: 'otp',
        success: true,
        flagged: false,
      });
      user.totalLogins = (user.totalLogins || 0) + 1;
    }

    if (isMongoDB()) await user.save();
    else mockStore.set(normalizedId, user);

    res.json({
      success: true,
      nextStep: requiresFace ? 'face' : 'dashboard',
      sessionToken: requiresFace ? null : user.sessionToken,
      tempToken: requiresFace ? tempToken : null,
      requiresFace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/verify-face
 * Accepts: { tempToken, faceData }
 * Returns: { success, sessionToken }
 */
exports.verifyFace = async (req, res, next) => {
  try {
    const { tempToken, faceData, identifier } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }

    const normalizedId = decoded.identifier || (identifier && identifier.toLowerCase().trim());

    let user;
    if (isMongoDB()) {
      user = await User.findOne({ identifier: normalizedId });
    } else {
      user = mockStore.get(normalizedId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User session not found.' });
    }

    // Simulate face verification (in production, use a face recognition API)
    const faceVerified = faceData && faceData.length > 100; // Mock: any substantial data passes
    const confidence = faceVerified ? (85 + Math.random() * 14).toFixed(1) : 0;

    if (!faceVerified) {
      user.flaggedAttempts = (user.flaggedAttempts || 0) + 1;
      if (isMongoDB()) await user.save();
      else mockStore.set(normalizedId, user);
      return res.status(400).json({ success: false, message: 'Face verification failed. Please try again.' });
    }

    // Full auth complete
    const sessionToken = signToken({ identifier: normalizedId, sessionId: uuidv4(), verified: true, faceVerified: true });
    user.sessionToken = sessionToken;
    user.faceVerified = true;
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.unshift({
      timestamp: new Date(),
      ip: req.ip || '127.0.0.1',
      location: 'Unknown',
      device: 'Web Browser',
      riskLevel: decoded.riskLevel || 'high',
      authMethod: 'otp+face',
      success: true,
      flagged: false,
    });
    user.totalLogins = (user.totalLogins || 0) + 1;

    if (isMongoDB()) await user.save();
    else mockStore.set(normalizedId, user);

    res.json({
      success: true,
      sessionToken,
      confidence: parseFloat(confidence),
      message: 'Face verification successful.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resend-otp
 */
exports.resendOtp = async (req, res, next) => {
  try {
    const { tempToken, identifier } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid session.' });
    }

    const normalizedId = decoded.identifier || (identifier && identifier.toLowerCase().trim());
    const newOtp = generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    let user;
    if (isMongoDB()) {
      user = await User.findOne({ identifier: normalizedId });
      if (user) {
        user.currentOtp = { code: newOtp, expiresAt: expiry, attempts: 0 };
        await user.save();
      }
    } else {
      user = mockStore.get(normalizedId) || {};
      user.currentOtp = { code: newOtp, expiresAt: expiry, attempts: 0 };
      mockStore.set(normalizedId, user);
    }

    console.log(`🔑 Resent OTP for ${normalizedId}: ${newOtp}`);

    res.json({
      success: true,
      message: 'OTP resent successfully.',
      ...(process.env.NODE_ENV === 'development' ? { devOtp: newOtp } : {}),
    });
  } catch (error) {
    next(error);
  }
};
