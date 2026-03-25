import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginApi, collectDeviceInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CyberBackground from '../components/CyberBackground';

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
};

const RISK_STEPS = {
  low: { label: 'LOW THREAT', color: '#00ff9d', bar: '33%' },
  medium: { label: 'MEDIUM THREAT', color: '#f59e0b', bar: '66%' },
  high: { label: 'HIGH THREAT', color: '#ef4444', bar: '100%' },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setLoginResult, isAuthenticated } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    const info = collectDeviceInfo();
    setDeviceInfo(info);
  }, []);

  const analysisSteps = [
    'Scanning device fingerprint...',
    'Analyzing network patterns...',
    'Checking threat intelligence...',
    'Computing risk score...',
    'Initiating auth flow...',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      toast.error('Please enter a valid email or phone number');
      return;
    }

    setAnalyzing(true);
    setLoading(true);

    // Animated analysis steps
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      setAnalysisStep(step);
      if (step >= analysisSteps.length - 1) clearInterval(stepInterval);
    }, 500);

    try {
      await new Promise(r => setTimeout(r, 2500));
      const data = await loginApi(identifier.trim());

      clearInterval(stepInterval);
      setAnalyzing(false);
      setDetected(true);

      setTimeout(() => {
        setLoginResult(data);
        if (data.nextStep === 'otp') {
          toast.success(`Risk level: ${data.riskLevel.toUpperCase()} — OTP required`);
          navigate('/otp');
        } else {
          localStorage.setItem('sp_session', data.sessionToken);
          toast.success('Access granted — Low risk session');
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err) {
      clearInterval(stepInterval);
      setAnalyzing(false);
      setLoading(false);
      setAnalysisStep(0);
      toast.error(err.response?.data?.message || 'Authentication failed. Please retry.');
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative px-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <CyberBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,255,157,0.1))', border: '1px solid rgba(0,229,255,0.4)' }}
              animate={{ boxShadow: ['0 0 20px rgba(0,229,255,0.3)', '0 0 40px rgba(0,229,255,0.6)', '0 0 20px rgba(0,229,255,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="rgba(0,229,255,0.3)" stroke="#00e5ff" strokeWidth="1.5" />
                <path d="M9 12l2 2 4-4" stroke="#00ff9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-orbitron font-bold neon-text tracking-wider">
              SECURE<span style={{ color: '#00ff9d' }}>PASS</span>
            </h1>
          </div>
          <p className="text-xs font-fira text-slate-400 tracking-widest uppercase">
            Intelligent Password-less Authentication
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="glass-card p-8"
          style={{ boxShadow: '0 0 60px rgba(0,229,255,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Device Info Banner */}
          {deviceInfo && !analyzing && !detected && (
            <motion.div
              className="flex items-center gap-2 mb-6 p-3 rounded-lg"
              style={{ background: 'rgba(0,255,157,0.05)', border: '1px solid rgba(0,255,157,0.15)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-neon animate-pulse" />
              <span className="text-xs font-fira text-slate-400">
                Device detected: <span className="text-green-neon">{deviceInfo.name}</span>
              </span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!analyzing && !detected ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-6">
                  <label className="block text-xs font-fira text-slate-400 mb-2 tracking-widest uppercase">
                    Identity Identifier
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="email@domain.com or +1234567890"
                      className="input-neon w-full pl-10 pr-4 py-3 text-sm"
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Risk info */}
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                  <p className="text-xs font-fira text-slate-500 mb-2">ADAPTIVE SECURITY ENGINE</p>
                  <div className="space-y-1.5">
                    {[
                      { level: 'LOW', color: '#00ff9d', desc: 'Direct access granted' },
                      { level: 'MEDIUM', color: '#f59e0b', desc: 'OTP verification required' },
                      { level: 'HIGH', color: '#ef4444', desc: 'OTP + Face ID required' },
                    ].map(item => (
                      <div key={item.level} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs font-fira" style={{ color: item.color }}>{item.level}</span>
                        <span className="text-xs text-slate-500">→ {item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="btn-neon-solid w-full py-3 rounded-lg text-sm font-orbitron font-bold tracking-widest"
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  INITIATE AUTHENTICATION
                </motion.button>

                <p className="text-center text-xs text-slate-600 mt-4 font-fira">
                  Protected by SecurePass Adaptive AI Engine v2.4
                </p>
              </motion.form>
            ) : analyzing ? (
              <motion.div
                key="analyzing"
                className="py-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${i === 0 ? '#00e5ff' : i === 1 ? '#00ff9d' : 'rgba(0,229,255,0.3)'}` }}
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ duration: 2 - i * 0.3, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-3 h-3 rounded-full bg-cyan-neon"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                </div>

                <p className="text-xs font-fira text-slate-500 mb-4 tracking-widest uppercase">Risk Analysis in Progress</p>

                <div className="space-y-2 text-left">
                  {analysisSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= analysisStep ? 1 : 0.2, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {i < analysisStep ? (
                        <svg className="w-3 h-3 text-green-neon flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : i === analysisStep ? (
                        <motion.div className="w-3 h-3 rounded-full bg-cyan-neon flex-shrink-0" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-slate-700 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-fira ${i <= analysisStep ? 'text-slate-300' : 'text-slate-600'}`}>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="detected"
                className="py-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(0,255,157,0.15)', border: '2px solid #00ff9d' }}
                  animate={{ boxShadow: ['0 0 20px rgba(0,255,157,0.3)', '0 0 40px rgba(0,255,157,0.6)', '0 0 20px rgba(0,255,157,0.3)'] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <p className="font-orbitron text-green-neon font-bold mb-1">IDENTITY VERIFIED</p>
                <p className="text-xs text-slate-500 font-fira">Redirecting to authentication flow...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs text-slate-700 mt-6 font-fira"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          © 2025 SecurePass Systems. All access logged & monitored.
        </motion.p>
      </div>
    </motion.div>
  );
}
