import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { verifyOtpApi, resendOtpApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CyberBackground from '../components/CyberBackground';
import RiskBadge from '../components/RiskBadge';

const OTP_LENGTH = 6;
const TIMER_SECONDS = 300; // 5 min

export default function OtpPage() {
  const navigate = useNavigate();
  const { authState, setLoginResult, setSessionToken } = useAuth();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [resending, setResending] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-show dev OTP hint
  useEffect(() => {
    if (authState.devOtp) {
      toast(`Dev OTP: ${authState.devOtp}`, {
        icon: '🔑',
        duration: 8000,
        style: { fontFamily: 'Fira Code, monospace', letterSpacing: '0.2em' },
      });
    }
  }, [authState.devOtp]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all digits filled
    if (value && index === OTP_LENGTH - 1 && newDigits.every(d => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newDigits = [...digits];
    pasted.split('').forEach((c, i) => { if (i < OTP_LENGTH) newDigits[i] = c; });
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex(d => d === '');
    if (nextEmpty === -1) {
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(newDigits.join(''));
    } else {
      inputRefs.current[nextEmpty]?.focus();
    }
  };

  const handleVerify = useCallback(async (otpValue) => {
    const otp = otpValue || digits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }
    if (timeLeft === 0) {
      setError('OTP expired. Please request a new one.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyOtpApi(otp, authState.tempToken, authState.identifier);
      if (data.nextStep === 'face') {
        toast.success('OTP verified! Face verification required.');
        setLoginResult({ ...authState, tempToken: data.tempToken || authState.tempToken });
        navigate('/face');
      } else {
        setSessionToken(data.sessionToken);
        toast.success('OTP verified! Access granted.');
        navigate('/dashboard');
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(msg);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [digits, timeLeft, authState, navigate]);

  const handleResend = async () => {
    setResending(true);
    try {
      const data = await resendOtpApi(authState.tempToken, authState.identifier);
      toast.success('New OTP sent!');
      setTimeLeft(TIMER_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      if (data.devOtp) {
        toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 8000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const maskedIdentifier = authState.identifier
    ? authState.identifier.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '••••@••••.com';

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CyberBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-orbitron font-bold text-2xl neon-text">SECURE</span>
            <span className="font-orbitron font-bold text-2xl" style={{ color: '#00ff9d' }}>PASS</span>
          </div>
          <p className="text-xs font-fira text-slate-500 tracking-widest">STEP 2 — OTP VERIFICATION</p>
        </motion.div>

        <motion.div
          className="glass-card p-8"
          style={{ boxShadow: '0 0 60px rgba(0,229,255,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Risk Badge */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-orbitron font-bold text-white text-lg mb-1">Verify Identity</h2>
              <p className="text-xs font-fira text-slate-500">Code sent to <span className="text-cyan-neon">{maskedIdentifier}</span></p>
            </div>
            {authState.riskLevel && <RiskBadge level={authState.riskLevel} />}
          </div>

          {/* Timer Ring */}
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="4" />
                <motion.circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={timeLeft < 60 ? '#ef4444' : timeLeft < 120 ? '#f59e0b' : '#00e5ff'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - timeLeft / TIMER_SECONDS)}`}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-fira font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-cyan-neon'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* OTP Inputs */}
          <motion.div
            className="flex gap-3 justify-center mb-6"
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {digits.map((digit, i) => (
              <motion.div key={i} className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <input
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={loading || timeLeft === 0}
                  className="w-11 h-14 text-center text-xl font-fira font-bold rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: digit ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.04)',
                    border: digit ? '2px solid rgba(0,229,255,0.7)' : '1px solid rgba(0,229,255,0.2)',
                    color: digit ? '#00e5ff' : '#64748b',
                    boxShadow: digit ? '0 0 15px rgba(0,229,255,0.2)' : 'none',
                    caretColor: '#00e5ff',
                  }}
                />
                {digit && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-cyan-neon"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-4 p-3 rounded-lg text-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-red-400 text-xs font-fira">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify Button */}
          <motion.button
            onClick={() => handleVerify()}
            disabled={loading || digits.some(d => d === '') || timeLeft === 0}
            className="btn-neon-solid w-full py-3 rounded-lg text-sm font-orbitron font-bold tracking-widest mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div className="w-4 h-4 border-2 border-space border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                VERIFYING...
              </span>
            ) : 'VERIFY OTP'}
          </motion.button>

          {/* Resend */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <button onClick={handleResend} disabled={resending} className="text-xs font-fira text-slate-500 hover:text-cyan-neon transition-colors disabled:opacity-40">
                {resending ? 'Sending...' : "Didn't receive it? Resend OTP"}
              </button>
            ) : (
              <button onClick={handleResend} disabled={resending} className="text-xs font-fira text-cyan-neon hover:underline">
                {resending ? 'Sending...' : 'OTP expired — Click to resend'}
              </button>
            )}
          </div>

          {/* Risk factors */}
          {authState.riskFactors?.length > 0 && (
            <motion.div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(0,229,255,0.1)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <p className="text-xs font-fira text-slate-600 mb-2">RISK FACTORS DETECTED:</p>
              <div className="space-y-1">
                {authState.riskFactors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    <span className="text-xs font-fira text-slate-500">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center gap-2 mx-auto text-xs text-slate-600 hover:text-slate-400 font-fira transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to login
        </motion.button>
      </div>
    </motion.div>
  );
}
