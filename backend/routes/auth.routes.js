const express = require('express');
const router = express.Router();
const { login, verifyOtp, verifyFace, resendOtp } = require('../controllers/auth.controller');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/verify-face', verifyFace);
router.post('/resend-otp', otpLimiter, resendOtp);

module.exports = router;
