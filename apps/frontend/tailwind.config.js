/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores del proyecto legacy OVP
        primary: {
          DEFAULT: '#97aa79',
          light: '#a2ae5a',
        },
        accent: {
          DEFAULT: '#D3D379',
        },
        brand: {
          green: '#95C11F',
        },
        ovp: {
          // Backgrounds
          'bg-light': '#FAF6ED',
          'bg-alt': '#e9e9e9',
          // Text colors
          'text-dark': '#19202c',
          'text-secondary': '#2d3748',
          'text-light': '#666666',
          // Dark mode colors
          'dark': '#19202c',
          'dark-secondary': '#2d3748',
          'dark-bg': '#2D3748',
          'dark-bg-alt': '#1A202C',
          'dark-header': '#4A5568',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
      },
      fontSize: {
        'base-fluid': 'clamp(14px, 2vw, 16px)',
        'small-fluid': 'clamp(13px, 1.8vw, 15px)',
        'question-fluid': 'clamp(15px, 2.2vw, 17px)',
      },
      spacing: {
        'xs-fluid': 'clamp(4px, 1vw, 6px)',
        'sm-fluid': 'clamp(8px, 2vw, 12px)',
        'md-fluid': 'clamp(12px, 3vw, 20px)',
        'lg-fluid': 'clamp(20px, 4vw, 32px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'zoom-in': 'zoomIn 0.3s ease-out',
        'blink': 'blink 1s ease-in-out infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
      },
      borderRadius: {
        'message': 'clamp(14px, 4vw, 20px)',
      },
      boxShadow: {
        'message': '0 0 20px rgba(0, 0, 0, 0.1)',
        'message-dark': '0 0 20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}