/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'confirm-check-in': {
          '0%':   { transform: 'scale(0.4)', opacity: '0' },
          '60%':  { transform: 'scale(1.15)', opacity: '1' },
          '80%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'confirm-check-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.55)' },
          '70%':  { boxShadow: '0 0 0 18px rgba(34, 197, 94, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
        },
        'confirm-pulse-blue': {
          '0%, 50%, 100%': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
          '15%':           { boxShadow: '0 0 0 6px rgba(37, 99, 235, 0.18), 0 4px 12px -2px rgba(37, 99, 235, 0.45)' },
        },
        'confirm-pulse-green': {
          '0%, 50%, 100%': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
          '65%':           { boxShadow: '0 0 0 6px rgba(22, 163, 74, 0.18), 0 4px 12px -2px rgba(22, 163, 74, 0.45)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'confirm-check-in':   'confirm-check-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'confirm-check-ring': 'confirm-check-ring 1.4s ease-out 0.5s both',
        'confirm-pulse-blue': 'confirm-pulse-blue 2.6s ease-in-out infinite',
        'confirm-pulse-green':'confirm-pulse-green 2.6s ease-in-out infinite',
        'bounce-gentle':      'bounce-gentle 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};