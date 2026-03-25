import React from 'react';
import { motion } from 'framer-motion';

export default function CyberBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid */}
      <div className="absolute inset-0 cyber-grid opacity-60" />

      {/* Central radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)' }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64" style={{ background: 'radial-gradient(circle at 0% 0%, rgba(0,229,255,0.08) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64" style={{ background: 'radial-gradient(circle at 100% 100%, rgba(0,255,157,0.06) 0%, transparent 60%)' }} />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? '#00ff9d' : '#00e5ff',
            left: `${(i * 8.3) % 100}%`,
            top: `${(i * 13.7) % 100}%`,
            opacity: 0.3 + (i % 4) * 0.15,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Horizontal scan lines */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
