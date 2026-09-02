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
        // Cova brand palette
        cova: {
          bg: '#0B0C10',
          surface: '#12141D',
          surfaceHover: '#181B27',
          border: '#1F2232',
          borderStrong: '#2A2E40',
          text: '#FFFFFF',
          textSecondary: '#9CA3AF',
          textMuted: '#6B7280',
          // Primary / accent
          primary: '#7C3AED',
          primaryHover: '#8B5CF6',
          primaryLight: '#2A1B5C',
          // Status colors (per spec)
          credentials: '#EF4444',   // red - credentials
          notes: '#22C55E',         // green - notes/wallet
          tasks: '#F97316',         // orange - tasks
          danger: '#EF4444',
          dangerHover: '#DC2626',
          dangerLight: '#3F1212',
          success: '#22C55E',
          successLight: '#0E2A18',
          warning: '#F59E0B',
          warningLight: '#3A2510',
          sidebar: '#0E1018',
          sidebarBorder: '#1F2232',
          input: '#12141D',
          inputBorder: '#2A2E40',
          inputFocus: '#7C3AED',
          overlay: 'rgba(0, 0, 0, 0.75)',
          modal: '#12141D',
          scrollbar: '#1F2232',
          scrollbarHover: '#2A2E40',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.8125rem', { lineHeight: '1.5' }],
        'base': ['0.875rem', { lineHeight: '1.5' }],
        'md': ['0.9375rem', { lineHeight: '1.5' }],
        'lg': ['1rem', { lineHeight: '1.5' }],
        'xl': ['1.125rem', { lineHeight: '1.4' }],
        '2xl': ['1.25rem', { lineHeight: '1.3' }],
        '3xl': ['1.5rem', { lineHeight: '1.2' }],
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.2)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        'DEFAULT': '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        'md': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        'lg': '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
        'glow': '0 0 20px rgba(124, 58, 237, 0.25)',
      },
      transitionDuration: {
        'fast': '120ms',
        'DEFAULT': '180ms',
        'slow': '240ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}