import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_session');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// --- Device Fingerprint ---
export const getDeviceFingerprint = () => {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    nav.platform,
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(16).padStart(8, '0');
};

export const collectDeviceInfo = () => {
  const nav = window.navigator;
  const ua = nav.userAgent;

  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let platform = 'Unknown';
  if (ua.includes('Windows')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'macOS';
  else if (ua.includes('Linux')) platform = 'Linux';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';

  return {
    fingerprint: getDeviceFingerprint(),
    userAgent: ua,
    browser,
    platform,
    screen: `${window.screen.width}x${window.screen.height}`,
    language: nav.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    name: `${browser} on ${platform}`,
  };
};

// --- Auth APIs ---
export const loginApi = async (identifier) => {
  const deviceInfo = collectDeviceInfo();
  const res = await api.post('/login', { identifier, deviceInfo });
  return res.data;
};

export const verifyOtpApi = async (otp, tempToken, identifier) => {
  const res = await api.post('/verify-otp', { otp, tempToken, identifier });
  return res.data;
};

export const verifyFaceApi = async (faceData, tempToken, identifier) => {
  const res = await api.post('/verify-face', { faceData, tempToken, identifier });
  return res.data;
};

export const resendOtpApi = async (tempToken, identifier) => {
  const res = await api.post('/resend-otp', { tempToken, identifier });
  return res.data;
};

// --- Dashboard API ---
export const getDashboardApi = async () => {
  const res = await api.get('/dashboard');
  return res.data;
};

export default api;
