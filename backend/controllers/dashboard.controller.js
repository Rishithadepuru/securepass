const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'securepass_default_secret';

// Mock data store reference (shared concept)
const mockStore = new Map();

const isMongoDB = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

const generateMockHistory = (identifier) => {
  const methods = ['direct', 'otp', 'otp+face'];
  const risks = ['low', 'medium', 'high'];
  const devices = ['Chrome on Windows', 'Safari on macOS', 'Firefox on Linux', 'Mobile Safari', 'Chrome on Android'];
  const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Berlin, DE', 'Unknown', 'Sydney, AU'];

  return Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3.6e6 * (Math.random() * 8 + 1)),
    ip: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.1`,
    location: locations[Math.floor(Math.random() * locations.length)],
    device: devices[Math.floor(Math.random() * devices.length)],
    riskLevel: risks[Math.floor(Math.random() * risks.length)],
    authMethod: methods[Math.floor(Math.random() * methods.length)],
    success: Math.random() > 0.15,
    flagged: Math.random() > 0.85,
  }));
};

const generateMockDevices = () => [
  { fingerprint: 'fp_abc123', name: 'Chrome on Windows 11', platform: 'Windows', trusted: true, lastSeen: new Date() },
  { fingerprint: 'fp_def456', name: 'Safari on iPhone 15', platform: 'iOS', trusted: true, lastSeen: new Date(Date.now() - 86400000) },
  { fingerprint: 'fp_ghi789', name: 'Firefox on Ubuntu', platform: 'Linux', trusted: false, lastSeen: new Date(Date.now() - 7 * 86400000) },
];

const computeStats = (history) => {
  const total = history.length;
  const successful = history.filter(h => h.success).length;
  const flagged = history.filter(h => h.flagged).length;
  const high = history.filter(h => h.riskLevel === 'high').length;
  const medium = history.filter(h => h.riskLevel === 'medium').length;
  const low = history.filter(h => h.riskLevel === 'low').length;

  // Last 7 days activity
  const now = Date.now();
  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now - (6 - i) * 86400000);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    const count = history.filter(h => {
      const d = new Date(h.timestamp);
      return d.toDateString() === date.toDateString();
    }).length;
    return { date: dateStr, logins: count };
  });

  return { total, successful, flagged, high, medium, low, daily };
};

/**
 * GET /api/dashboard
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }

    const identifier = decoded.identifier;
    let user, loginHistory, devices;

    if (isMongoDB()) {
      user = await User.findOne({ identifier });
    }

    if (user) {
      loginHistory = user.loginHistory || [];
      devices = user.devices || [];
    } else {
      // Use mock data
      loginHistory = generateMockHistory(identifier);
      devices = generateMockDevices();
    }

    const stats = computeStats(loginHistory);

    // Risk distribution for charts
    const riskDistribution = [
      { name: 'Low', value: stats.low, color: '#00ff9d' },
      { name: 'Medium', value: stats.medium, color: '#f59e0b' },
      { name: 'High', value: stats.high, color: '#ef4444' },
    ];

    // Auth method breakdown
    const authMethods = ['direct', 'otp', 'otp+face'].map(method => ({
      method,
      count: loginHistory.filter(h => h.authMethod === method).length,
    }));

    res.json({
      success: true,
      user: {
        identifier,
        totalLogins: user?.totalLogins || loginHistory.length,
        flaggedAttempts: user?.flaggedAttempts || stats.flagged,
        riskLevel: user?.riskLevel || 'medium',
        faceVerified: user?.faceVerified || false,
        memberSince: user?.createdAt || new Date(Date.now() - 30 * 86400000),
      },
      stats,
      loginHistory: loginHistory.slice(0, 50),
      devices,
      riskDistribution,
      authMethods,
      dailyActivity: stats.daily,
    });
  } catch (error) {
    next(error);
  }
};
