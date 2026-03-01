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
          'bg-0':        'rgb(var(--fdp-bg-0) / <alpha-value>)',
          'bg-1':        'rgb(var(--fdp-bg-1) / <alpha-value>)',
          'bg-2':        'rgb(var(--fdp-bg-2) / <alpha-value>)',
          'surface-1':   'rgb(var(--fdp-surface-1) / <alpha-value>)',
          'surface-2':   'rgb(var(--fdp-surface-2) / <alpha-value>)',
          'border-1':    'rgb(var(--fdp-border-1) / <alpha-value>)',
          'border-2':    'rgb(var(--fdp-border-2) / <alpha-value>)',
          'text-1':      'rgb(var(--fdp-text-1) / <alpha-value>)',
          'text-2':      'rgb(var(--fdp-text-2) / <alpha-value>)',
          'text-3':      'rgb(var(--fdp-text-3) / <alpha-value>)',
          'accent-1':    'rgb(var(--fdp-accent-1) / <alpha-value>)',
          'accent-2':    'rgb(var(--fdp-accent-2) / <alpha-value>)',
          'accent-glow': 'rgb(var(--fdp-accent-glow) / <alpha-value>)',
          'pos':         'rgb(var(--fdp-pos) / <alpha-value>)',
          'neg':         'rgb(var(--fdp-neg) / <alpha-value>)',
          'warn':        'rgb(var(--fdp-warn) / <alpha-value>)',
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
