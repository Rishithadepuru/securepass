/**
 * Risk Engine – evaluates authentication risk based on multiple signals
 * Returns: 'low' | 'medium' | 'high'
 */

const RISK_WEIGHTS = {
  newDevice: 30,
  unusualTime: 15,
  multipleFailedAttempts: 25,
  newLocation: 20,
  highFrequency: 20,
  suspiciousUA: 10,
};

/**
 * Classify risk score into level
 */
const classifyRisk = (score) => {
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

/**
 * Check if current hour is unusual (midnight-5am local)
 */
const isUnusualTime = () => {
  const hour = new Date().getHours();
  return hour >= 0 && hour <= 5;
};

/**
 * Check if device fingerprint is known
 */
const isNewDevice = (user, fingerprint) => {
  if (!user || !user.devices || user.devices.length === 0) return true;
  return !user.devices.some(d => d.fingerprint === fingerprint);
};

/**
 * Check if user has recent failed attempts
 */
const hasRecentFailedAttempts = (user) => {
  if (!user || !user.loginHistory) return false;
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentFails = user.loginHistory.filter(
    h => !h.success && new Date(h.timestamp) > tenMinutesAgo
  );
  return recentFails.length >= 2;
};

/**
 * Check for high-frequency login attempts
 */
const isHighFrequency = (user) => {
  if (!user || !user.loginHistory) return false;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLogins = user.loginHistory.filter(
    h => new Date(h.timestamp) > oneHourAgo
  );
  return recentLogins.length >= 5;
};

/**
 * Main risk assessment function
 */
const assessRisk = (user, deviceInfo) => {
  let score = 0;
  const factors = [];

  const fingerprint = deviceInfo?.fingerprint || '';

  if (isNewDevice(user, fingerprint)) {
    score += RISK_WEIGHTS.newDevice;
    factors.push('New or unrecognized device');
  }

  if (isUnusualTime()) {
    score += RISK_WEIGHTS.unusualTime;
    factors.push('Login at unusual hour');
  }

  if (hasRecentFailedAttempts(user)) {
    score += RISK_WEIGHTS.multipleFailedAttempts;
    factors.push('Multiple recent failed attempts');
  }

  if (isHighFrequency(user)) {
    score += RISK_WEIGHTS.highFrequency;
    factors.push('High login frequency detected');
  }

  // New user (first login ever)
  if (!user || user.totalLogins === 0) {
    score += 10;
    factors.push('First-time login');
  }

  const level = classifyRisk(score);

  return {
    level,
    score,
    factors,
    requiresOtp: level === 'medium' || level === 'high',
    requiresFace: level === 'high',
  };
};

module.exports = { assessRisk, classifyRisk };
