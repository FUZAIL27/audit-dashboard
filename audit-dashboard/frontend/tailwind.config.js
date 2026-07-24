/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#08090C',
          900: '#0C0E13',
          800: '#12141B',
          700: '#1A1D26',
          600: '#242833',
          500: '#333844',
        },
        border: {
          DEFAULT: '#1F232C',
          strong: '#2A2F3B',
        },
        text: {
          primary: '#E8EAF0',
          secondary: '#9AA1B2',
          muted: '#5F6575',
        },
        signal: {
          DEFAULT: '#4CC9F0',
          dim: '#2E7FA0',
          glow: '#7DE0FF',
        },
        severity: {
          critical: '#F0465C',
          high: '#F5A524',
          medium: '#F5D90A',
          low: '#34D399',
        },
        status: {
          pending: '#9AA1B2',
          investigating: '#4CC9F0',
          resolved: '#34D399',
          ignored: '#5F6575',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(76,201,240,0.15), 0 0 24px rgba(76,201,240,0.08)',
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(76,201,240,0.06), transparent 60%), radial-gradient(circle at 50% 0%, rgba(76,201,240,0.08), transparent 55%)',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        pulseSignal: 'pulseSignal 2s ease-in-out infinite',
        scanline: 'scanline 6s linear infinite',
      },
    },
  },
  plugins: [],
};
