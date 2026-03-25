import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';
import { verifyFaceApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CyberBackground from '../components/CyberBackground';
import RiskBadge from '../components/RiskBadge';

const SCAN_STATES = {
  idle: 'idle',
  requesting: 'requesting',
  scanning: 'scanning',
  analyzing: 'analyzing',
  success: 'success',
  failed: 'failed',
  fallback: 'fallback',
};

export default function FacePage() {
  const navigate = useNavigate();
  const { authState, setSessionToken } = useAuth();
  const webcamRef = useRef(null);
  const [scanState, setScanState] = useState(SCAN_STATES.idle);
  const [cameraAvailable, setCameraAvailable] = useState(null);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [fallbackCode, setFallbackCode] = useState('');

  useEffect(() => {
    // Check camera availability
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(() => setCameraAvailable(true))
      .catch(() => setCameraAvailable(false));
  }, []);

  // Scan line animation during scanning
  useEffect(() => {
    if (scanState !== SCAN_STATES.scanning) return;
    const interval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2));
    }, 30);
    return () => clearInterval(interval);
  }, [scanState]);

  const startScan = useCallback(async () => {
    setScanState(SCAN_STATES.scanning);
    setProgress(0);

    // Simulate progressive scan
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 5;
      });
    }, 200);

    await new Promise(r => setTimeout(r, 3000));
    clearInterval(progressInterval);
    setProgress(95);
    setScanState(SCAN_STATES.analyzing);

    // Capture frame
    let imageData = null;
    if (webcamRef.current) {
      imageData = webcamRef.current.getScreenshot();
    }

    // Use mock data if no camera
    const faceData = imageData || 'mock_face_data_' + Date.now() + '_' + Math.random().toString(36).slice(2, 50);

    try {
      const data = await verifyFaceApi(faceData, authState.tempToken, authState.identifier);
      setProgress(100);
      setConfidence(data.confidence || 94.2);
      setScanState(SCAN_STATES.success);
      toast.success(`Face verified! Confidence: ${(data.confidence || 94.2).toFixed(1)}%`);
      setTimeout(() => {
        setSessionToken(data.sessionToken);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setScanState(SCAN_STATES.failed);
      toast.error(err.response?.data?.message || 'Face verification failed');
      setTimeout(() => {
        setScanState(SCAN_STATES.idle);
        setProgress(0);
      }, 2500);
    }
  }, [authState, navigate]);

  const handleFallback = async () => {
    if (fallbackCode.length < 6) {
      toast.error('Please enter your backup security code');
      return;
    }
    setScanState(SCAN_STATES.analyzing);
    try {
      const data = await verifyFaceApi('fallback_' + fallbackCode.repeat(10), authState.tempToken, authState.identifier);
      setScanState(SCAN_STATES.success);
      setConfidence(data.confidence || 90);
      toast.success('Backup code verified!');
      setTimeout(() => {
        setSessionToken(data.sessionToken);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setScanState(SCAN_STATES.failed);
      toast.error('Invalid backup code');
      setTimeout(() => setScanState(SCAN_STATES.fallback), 1500);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CyberBackground />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-orbitron font-bold text-2xl neon-text">SECURE</span>
            <span className="font-orbitron font-bold text-2xl" style={{ color: '#00ff9d' }}>PASS</span>
          </div>
          <p className="text-xs font-fira text-slate-500 tracking-widest">STEP 3 — BIOMETRIC VERIFICATION</p>
        </motion.div>

        <motion.div
          className="glass-card p-8"
          style={{ boxShadow: '0 0 60px rgba(0,229,255,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-orbitron font-bold text-white text-lg mb-1">Face ID Verification</h2>
              <p className="text-xs font-fira text-slate-500">Position your face within the frame</p>
            </div>
            <RiskBadge level="high" />
          </div>

          {/* Camera View */}
          <AnimatePresence mode="wait">
            {scanState !== SCAN_STATES.fallback ? (
              <motion.div
                key="camera-view"
                className="relative rounded-xl overflow-hidden mb-6"
                style={{ aspectRatio: '4/3', background: '#010614', border: '2px solid rgba(0,229,255,0.2)' }}
              >
                {/* Webcam or placeholder */}
                {cameraAvailable ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: 'user' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-space">
                    <div className="text-center">
                      <motion.div
                        className="w-24 h-24 rounded-full border-2 border-cyan-neon mx-auto mb-3 flex items-center justify-center"
                        animate={{ boxShadow: ['0 0 20px rgba(0,229,255,0.3)', '0 0 40px rgba(0,229,255,0.6)', '0 0 20px rgba(0,229,255,0.3)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </motion.div>
                      <p className="text-xs font-fira text-slate-500">Camera simulation mode</p>
                    </div>
                  </div>
                )}

                {/* Corner brackets */}
                {['tl', 'tr', 'bl', 'br'].map(corner => (
                  <div
                    key={corner}
                    className="absolute w-8 h-8"
                    style={{
                      top: corner.startsWith('t') ? '12px' : 'auto',
                      bottom: corner.startsWith('b') ? '12px' : 'auto',
                      left: corner.endsWith('l') ? '12px' : 'auto',
                      right: corner.endsWith('r') ? '12px' : 'auto',
                      borderTop: corner.startsWith('t') ? '2px solid #00e5ff' : 'none',
                      borderBottom: corner.startsWith('b') ? '2px solid #00e5ff' : 'none',
                      borderLeft: corner.endsWith('l') ? '2px solid #00e5ff' : 'none',
                      borderRight: corner.endsWith('r') ? '2px solid #00e5ff' : 'none',
                    }}
                  />
                ))}

                {/* Oval face guide */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ width: '45%', paddingBottom: '55%', border: '1.5px dashed rgba(0,229,255,0.4)', borderRadius: '50%' }}
                />

                {/* Scan line */}
                {scanState === SCAN_STATES.scanning && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5"
                    style={{
                      top: `${scanLine}%`,
                      background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
                      boxShadow: '0 0 10px rgba(0,229,255,0.8)',
                    }}
                  />
                )}

                {/* Success overlay */}
                {scanState === SCAN_STATES.success && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,255,157,0.1)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-center">
                      <motion.div
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-2"
                        style={{ background: 'rgba(0,255,157,0.2)', border: '2px solid #00ff9d' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                      <p className="font-orbitron text-green-neon font-bold text-sm">MATCH CONFIRMED</p>
                      <p className="text-xs font-fira text-slate-400 mt-1">Confidence: {confidence.toFixed(1)}%</p>
                    </div>
                  </motion.div>
                )}

                {/* Failed overlay */}
                {scanState === SCAN_STATES.failed && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-2" style={{ border: '2px solid #ef4444' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <p className="font-orbitron text-red-400 font-bold text-sm">VERIFICATION FAILED</p>
                    </div>
                  </motion.div>
                )}

                {/* Status label */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-fira px-2 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.7)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)' }}>
                    {scanState === SCAN_STATES.scanning ? '● SCANNING' :
                     scanState === SCAN_STATES.analyzing ? '● ANALYZING' :
                     scanState === SCAN_STATES.success ? '● VERIFIED' :
                     scanState === SCAN_STATES.failed ? '● FAILED' : '● READY'}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="fallback-view"
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p className="text-xs font-fira text-amber-400 mb-1">⚠ CAMERA UNAVAILABLE</p>
                  <p className="text-xs text-slate-500 font-fira">Enter your 8-digit backup security code to proceed.</p>
                </div>
                <input
                  type="text"
                  value={fallbackCode}
                  onChange={e => setFallbackCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Enter backup code"
                  className="input-neon w-full px-4 py-3 text-center text-xl font-fira tracking-[0.5em] mb-4"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          {(scanState === SCAN_STATES.scanning || scanState === SCAN_STATES.analyzing) && (
            <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between text-xs font-fira text-slate-500 mb-1">
                <span>Biometric Analysis</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(0,229,255,0.1)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00e5ff, #00ff9d)', boxShadow: '0 0 10px rgba(0,229,255,0.5)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {scanState === SCAN_STATES.fallback ? (
              <motion.button
                onClick={handleFallback}
                disabled={fallbackCode.length < 6}
                className="btn-neon-solid w-full py-3 rounded-lg text-sm font-orbitron font-bold tracking-widest disabled:opacity-40"
                whileTap={{ scale: 0.98 }}
              >
                VERIFY BACKUP CODE
              </motion.button>
            ) : (
              <motion.button
                onClick={startScan}
                disabled={scanState !== SCAN_STATES.idle && scanState !== SCAN_STATES.failed}
                className="btn-neon-solid w-full py-3 rounded-lg text-sm font-orbitron font-bold tracking-widest disabled:opacity-40"
                whileTap={{ scale: 0.98 }}
              >
                {scanState === SCAN_STATES.idle ? 'START FACE SCAN' :
                 scanState === SCAN_STATES.scanning ? 'SCANNING...' :
                 scanState === SCAN_STATES.analyzing ? 'ANALYZING...' :
                 scanState === SCAN_STATES.success ? '✓ VERIFIED' : 'RETRY SCAN'}
              </motion.button>
            )}

            {scanState === SCAN_STATES.idle && (
              <button
                onClick={() => setScanState(scanState === SCAN_STATES.fallback ? SCAN_STATES.idle : SCAN_STATES.fallback)}
                className="w-full py-2 text-xs font-fira text-slate-500 hover:text-slate-300 transition-colors"
              >
                {scanState === SCAN_STATES.fallback ? '← Back to camera' : "Can't use camera? Use backup code"}
              </button>
            )}
          </div>
        </motion.div>

        <motion.button
          onClick={() => navigate('/otp')}
          className="mt-4 flex items-center gap-2 mx-auto text-xs text-slate-600 hover:text-slate-400 font-fira transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to OTP
        </motion.button>
      </div>
    </motion.div>
  );
}
