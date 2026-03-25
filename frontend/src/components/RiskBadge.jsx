import React from 'react';
import { motion } from 'framer-motion';

const config = {
  low: { label: 'LOW RISK', className: 'risk-badge-low', dot: '#00ff9d', icon: '🛡️' },
  medium: { label: 'MEDIUM RISK', className: 'risk-badge-medium', dot: '#f59e0b', icon: '⚠️' },
  high: { label: 'HIGH RISK', className: 'risk-badge-high', dot: '#ef4444', icon: '🚨' },
};

export default function RiskBadge({ level, showIcon = true, size = 'md' }) {
  const c = config[level] || config.low;
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-full font-fira font-medium ${c.className} ${sizes[size]}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {showIcon && <span>{c.icon}</span>}
      {c.label}
    </motion.span>
  );
}
