/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        fdp: {
          'bg-0': '#0d0d14',
          'bg-1': '#111119',
          'bg-2': '#16161f',
          'surface-1': '#13131f',
          'surface-2': '#1a1a2e',
          'border-1': '#2d2d4a',
          'border-2': '#3d3d5c',
          'text-1': '#f0eeff',
          'text-2': '#c4c0e0',
          'text-3': '#8882a8',
          'accent-1': '#7c3aed',
          'accent-2': '#9f5ff5',
          'accent-glow': '#c084fc',
          'pos': '#22c55e',
          'neg': '#ef4444',
          'warn': '#f59e0b',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(124, 58, 237, 0.25)',
        'glow':    '0 0 16px rgba(124, 58, 237, 0.35)',
        'glow-lg': '0 0 32px rgba(124, 58, 237, 0.45)',
        'card':    '0 4px 24px rgba(0, 0, 0, 0.45)',
        'card-lg': '0 8px 40px rgba(0, 0, 0, 0.6)',
        'inner-glow': 'inset 0 1px 0 rgba(124, 58, 237, 0.15)',
      },
      animation: {
        'shimmer':    'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'fade-up':    'fade-up 0.4s ease-out',
        'slide-in':   'slide-in 0.3s ease-out',
        'float':      'float 4s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(124,58,237,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(124,58,237,0.7)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
