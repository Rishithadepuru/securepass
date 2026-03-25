import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CyberBackground from '../components/CyberBackground';
import RiskBadge from '../components/RiskBadge';
import { SkeletonCard, SkeletonTable, SkeletonChart } from '../components/Skeletons';

const StatCard = ({ label, value, sub, color = '#00e5ff', icon, loading }) => {
  if (loading) return <SkeletonCard />;
  return (
    <motion.div
      className="glass-card-hover p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-fira text-slate-500 tracking-widest uppercase">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="font-orbitron font-bold text-3xl mb-1" style={{ color }}>{value}</div>
      {sub && <div className="text-xs font-fira text-slate-500">{sub}</div>}
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs font-fira">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, authState } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await getDashboardApi();
      setData(res);
    } catch (err) {
      toast.error('Failed to load dashboard data');
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Session terminated. Goodbye.');
    navigate('/');
  };

  const tabs = ['overview', 'history', 'devices', 'analytics'];

  return (
    <div className="min-h-screen relative">
      <CyberBackground />

      {/* Nav */}
      <nav className="relative z-10 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)', background: 'rgba(3,6,26,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,255,157,0.1))', border: '1px solid rgba(0,229,255,0.4)' }}
              animate={{ boxShadow: ['0 0 10px rgba(0,229,255,0.3)', '0 0 20px rgba(0,229,255,0.5)', '0 0 10px rgba(0,229,255,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="rgba(0,229,255,0.3)" stroke="#00e5ff" strokeWidth="1.5" />
                <path d="M9 12l2 2 4-4" stroke="#00ff9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <span className="font-orbitron font-bold text-white text-sm tracking-wider">
              SECURE<span className="text-green-neon">PASS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-xs font-fira tracking-widest uppercase transition-all"
                style={{
                  background: activeTab === tab ? 'rgba(0,229,255,0.1)' : 'transparent',
                  color: activeTab === tab ? '#00e5ff' : '#64748b',
                  border: activeTab === tab ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-fira text-slate-500">Logged in as</p>
              <p className="text-xs font-fira text-cyan-neon truncate max-w-[150px]">{authState.identifier || data?.user?.identifier || 'user@securepass.io'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-neon px-4 py-2 rounded-lg text-xs"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile tabs */}
      <div className="relative z-10 md:hidden flex gap-1 px-4 pt-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-fira tracking-widest uppercase whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.03)',
              color: activeTab === tab ? '#00e5ff' : '#64748b',
              border: activeTab === tab ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(0,229,255,0.1)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Welcome */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="font-orbitron font-bold text-2xl text-white mb-1">
                    Security <span className="neon-text">Dashboard</span>
                  </h1>
                  <p className="text-sm font-fira text-slate-500">
                    Real-time authentication analytics & threat monitoring
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div className="w-2 h-2 rounded-full bg-green-neon" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <span className="text-xs font-fira text-green-neon">LIVE</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard loading={loading} label="Total Logins" value={loading ? '—' : data?.user?.totalLogins || 0} sub="All time sessions" icon="🔐" color="#00e5ff" />
                <StatCard loading={loading} label="Flagged Attempts" value={loading ? '—' : data?.stats?.flagged || 0} sub="Security incidents" icon="🚨" color="#ef4444" />
                <StatCard loading={loading} label="Trusted Devices" value={loading ? '—' : (data?.devices?.filter(d => d.trusted)?.length || 0)} sub="Verified endpoints" icon="💻" color="#00ff9d" />
                <StatCard loading={loading} label="Success Rate" value={loading ? '—' : `${data?.stats ? Math.round((data.stats.successful / Math.max(data.stats.total, 1)) * 100) : 0}%`} sub="Authentication rate" icon="✅" color="#a78bfa" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Activity Chart */}
                <div className="lg:col-span-2">
                  {loading ? <SkeletonChart /> : (
                    <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <h3 className="font-orbitron text-sm text-white mb-4">7-Day Login Activity</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data?.dailyActivity || []}>
                          <defs>
                            <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.07)" />
                          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="logins" name="Logins" stroke="#00e5ff" fill="url(#loginGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>

                {/* Risk Distribution Pie */}
                <div>
                  {loading ? <SkeletonChart /> : (
                    <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <h3 className="font-orbitron text-sm text-white mb-4">Risk Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={data?.riskDistribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                            {(data?.riskDistribution || []).map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={(val) => <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Fira Code' }}>{val}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Auth Methods Bar */}
              {!loading && (
                <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="font-orbitron text-sm text-white mb-4">Authentication Methods Used</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data?.authMethods || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.07)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }} />
                      <YAxis type="category" dataKey="method" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Fira Code' }} width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Sessions" radius={[0, 6, 6, 0]}>
                        {(data?.authMethods || []).map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#00ff9d' : i === 1 ? '#00e5ff' : '#a78bfa'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Recent History Preview */}
              <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-orbitron text-sm text-white">Recent Activity</h3>
                  <button onClick={() => setActiveTab('history')} className="text-xs font-fira text-cyan-neon hover:underline">View all →</button>
                </div>
                {loading ? <SkeletonTable rows={4} /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-fira">
                      <thead>
                        <tr className="text-slate-500 border-b" style={{ borderColor: 'rgba(0,229,255,0.08)' }}>
                          <th className="text-left pb-3 pr-4">Timestamp</th>
                          <th className="text-left pb-3 pr-4">Device</th>
                          <th className="text-left pb-3 pr-4">Risk</th>
                          <th className="text-left pb-3 pr-4">Method</th>
                          <th className="text-left pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.loginHistory || []).slice(0, 6).map((row, i) => (
                          <motion.tr
                            key={i}
                            className="border-b"
                            style={{ borderColor: 'rgba(0,229,255,0.05)' }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                              {new Date(row.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 pr-4 text-slate-300 whitespace-nowrap max-w-[160px] truncate">{row.device}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs risk-badge-${row.riskLevel}`}>{row.riskLevel?.toUpperCase()}</span>
                            </td>
                            <td className="py-3 pr-4 text-slate-400">{row.authMethod}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${row.success ? 'text-green-neon' : 'text-red-400'}`}
                                style={{ background: row.success ? 'rgba(0,255,157,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${row.success ? 'rgba(0,255,157,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                {row.success ? '✓ Success' : '✗ Failed'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h2 className="font-orbitron font-bold text-xl text-white mb-1">Login <span className="neon-text">History</span></h2>
                <p className="text-sm font-fira text-slate-500">Complete authentication event log</p>
              </div>
              <div className="glass-card p-6">
                {loading ? <SkeletonTable rows={10} /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-fira">
                      <thead>
                        <tr className="text-slate-500 border-b" style={{ borderColor: 'rgba(0,229,255,0.08)' }}>
                          {['Timestamp', 'IP Address', 'Location', 'Device', 'Risk Level', 'Auth Method', 'Status', 'Flagged'].map(h => (
                            <th key={h} className="text-left pb-3 pr-4 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.loginHistory || []).map((row, i) => (
                          <motion.tr
                            key={i}
                            className="border-b hover:bg-white/5 transition-colors"
                            style={{ borderColor: 'rgba(0,229,255,0.05)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.03, 0.5) }}
                          >
                            <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                            <td className="py-3 pr-4 text-slate-500">{row.ip}</td>
                            <td className="py-3 pr-4 text-slate-400">{row.location}</td>
                            <td className="py-3 pr-4 text-slate-300 max-w-[160px] truncate">{row.device}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded-full risk-badge-${row.riskLevel}`}>{row.riskLevel?.toUpperCase()}</span>
                            </td>
                            <td className="py-3 pr-4 text-slate-400">{row.authMethod}</td>
                            <td className="py-3 pr-4">
                              <span style={{ color: row.success ? '#00ff9d' : '#ef4444' }}>{row.success ? '✓' : '✗'}</span>
                            </td>
                            <td className="py-3">
                              {row.flagged ? <span className="text-amber-400">⚑</span> : <span className="text-slate-700">—</span>}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* DEVICES TAB */}
          {activeTab === 'devices' && (
            <motion.div key="devices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h2 className="font-orbitron font-bold text-xl text-white mb-1">Trusted <span className="neon-text">Devices</span></h2>
                <p className="text-sm font-fira text-slate-500">Registered authentication endpoints</p>
              </div>
              <div className="grid gap-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  (data?.devices || []).map((device, i) => (
                    <motion.div
                      key={i}
                      className="glass-card-hover p-6 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: device.trusted ? 'rgba(0,255,157,0.1)' : 'rgba(0,229,255,0.05)', border: `1px solid ${device.trusted ? 'rgba(0,255,157,0.3)' : 'rgba(0,229,255,0.1)'}` }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={device.trusted ? '#00ff9d' : '#64748b'} strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <path d="M8 21h8M12 17v4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-oxanium text-white font-medium">{device.name}</p>
                          <p className="text-xs font-fira text-slate-500 mt-0.5">
                            Last seen: {new Date(device.lastSeen).toLocaleDateString()} · {device.platform}
                          </p>
                          <p className="text-xs font-fira text-slate-600 mt-0.5">ID: {device.fingerprint}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-fira px-3 py-1 rounded-full ${device.trusted ? 'risk-badge-low' : 'risk-badge-medium'}`}>
                          {device.trusted ? '✓ Trusted' : '⚠ Unverified'}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h2 className="font-orbitron font-bold text-xl text-white mb-1">Risk <span className="neon-text">Analytics</span></h2>
                <p className="text-sm font-fira text-slate-500">Deep threat intelligence & pattern analysis</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Low Risk Sessions', value: data?.stats?.low || 0, color: '#00ff9d', pct: data?.stats ? Math.round((data.stats.low / Math.max(data.stats.total, 1)) * 100) : 0 },
                  { label: 'Medium Risk Sessions', value: data?.stats?.medium || 0, color: '#f59e0b', pct: data?.stats ? Math.round((data.stats.medium / Math.max(data.stats.total, 1)) * 100) : 0 },
                  { label: 'High Risk Sessions', value: data?.stats?.high || 0, color: '#ef4444', pct: data?.stats ? Math.round((data.stats.high / Math.max(data.stats.total, 1)) * 100) : 0 },
                ].map((item, i) => (
                  loading ? <SkeletonCard key={i} /> : (
                    <motion.div
                      key={i}
                      className="glass-card p-6"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <p className="text-xs font-fira text-slate-500 mb-3 tracking-widest">{item.label.toUpperCase()}</p>
                      <p className="font-orbitron text-3xl font-bold mb-3" style={{ color: item.color }}>{item.value}</p>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                      <p className="text-xs font-fira text-slate-600 mt-2">{item.pct}% of total sessions</p>
                    </motion.div>
                  )
                ))}
              </div>

              {!loading && (
                <>
                  <motion.div className="glass-card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <h3 className="font-orbitron text-sm text-white mb-4">Session Risk Score Over Time</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={data?.dailyActivity || []}>
                        <defs>
                          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.07)" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="logins" name="Total" stroke="#00e5ff" fill="url(#safeGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <h3 className="font-orbitron text-sm text-white mb-4">Threat Intelligence Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Active Threats', value: data?.stats?.high || 0, color: '#ef4444', icon: '🎯' },
                        { label: 'Blocked Attempts', value: data?.stats?.flagged || 0, color: '#f59e0b', icon: '🛡️' },
                        { label: 'Success Rate', value: `${data?.stats ? Math.round((data.stats.successful / Math.max(data.stats.total, 1)) * 100) : 0}%`, color: '#00ff9d', icon: '✅' },
                        { label: 'Auth Methods', value: '3', color: '#a78bfa', icon: '🔑' },
                      ].map((item, i) => (
                        <div key={i} className="p-4 rounded-lg text-center" style={{ background: `${item.color}10`, border: `1px solid ${item.color}30` }}>
                          <div className="text-xl mb-1">{item.icon}</div>
                          <div className="font-orbitron font-bold text-xl" style={{ color: item.color }}>{item.value}</div>
                          <div className="text-xs font-fira text-slate-500 mt-1">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
