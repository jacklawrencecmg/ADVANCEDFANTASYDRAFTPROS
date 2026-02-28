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
          'bg-0': '#0a1628',
          'bg-1': '#0f1e33',
          'bg-2': '#132540',
          'surface-1': '#162032',
          'surface-2': '#1a2842',
          'border-1': '#2a3f5f',
          'border-2': '#3a5070',
          'text-1': '#EAF2FF',
          'text-2': '#C7D5E8',
          'text-3': '#8FA2BF',
          'accent-1': '#00d4ff',
          'accent-2': '#3de0ff',
          'accent-glow': '#7deaff',
          'pos': '#2EE59D',
          'neg': '#FF4D6D',
          'warn': '#F5C542',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(0, 212, 255, 0.25)',
        'glow':    '0 0 16px rgba(0, 212, 255, 0.35)',
        'glow-lg': '0 0 32px rgba(0, 212, 255, 0.45)',
        'card':    '0 4px 24px rgba(0, 0, 0, 0.35)',
        'card-lg': '0 8px 40px rgba(0, 0, 0, 0.5)',
        'inner-glow': 'inset 0 1px 0 rgba(0, 212, 255, 0.15)',
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
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,212,255,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(0,212,255,0.7)' },
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
