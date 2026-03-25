const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true },
  userAgent: { type: String },
  platform: { type: String },
  screen: { type: String },
  language: { type: String },
  timezone: { type: String },
  trusted: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  name: { type: String, default: 'Unknown Device' },
}, { _id: false });

const LoginHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: '0.0.0.0' },
  location: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown' },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  authMethod: { type: String, enum: ['direct', 'otp', 'otp+face'], default: 'direct' },
  success: { type: Boolean, default: true },
  flagged: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  identifierType: {
    type: String,
    enum: ['email', 'phone'],
    default: 'email',
  },
  devices: [DeviceSchema],
  loginHistory: {
    type: [LoginHistorySchema],
    default: [],
  },
  currentOtp: {
    code: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  sessionToken: { type: String },
  sessionExpiry: { type: Date },
  totalLogins: { type: Number, default: 0 },
  flaggedAttempts: { type: Number, default: 0 },
  faceVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

UserSchema.methods.isSessionValid = function () {
  return this.sessionToken && this.sessionExpiry && new Date() < this.sessionExpiry;
};

UserSchema.methods.addLoginHistory = function (entry) {
  this.loginHistory.unshift(entry);
  if (this.loginHistory.length > 100) {
    this.loginHistory = this.loginHistory.slice(0, 100);
  }
  this.totalLogins += 1;
};

module.exports = mongoose.model('User', UserSchema);
