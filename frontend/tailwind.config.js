/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: '#03061a',
        'space-light': '#070d2a',
        'space-card': 'rgba(0,229,255,0.05)',
        cyan: {
          neon: '#00e5ff',
          glow: 'rgba(0,229,255,0.3)',
        },
        green: {
          neon: '#00ff9d',
        },
        risk: {
          low: '#00ff9d',
          medium: '#f59e0b',
          high: '#ef4444',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        oxanium: ['Oxanium', 'sans-serif'],
        fira: ['"Fira Code"', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(0,229,255,0.4), 0 0 60px rgba(0,229,255,0.1)',
        'neon-green': '0 0 20px rgba(0,255,157,0.4), 0 0 60px rgba(0,255,157,0.1)',
        'neon-red': '0 0 20px rgba(239,68,68,0.4)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,229,255,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0,229,255,0.8), 0 0 80px rgba(0,229,255,0.3)' },
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(-2px, 2px)' },
          '50%': { transform: 'translate(2px, -2px)' },
          '75%': { transform: 'translate(-1px, 1px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
