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
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        app: {
          bg: 'var(--app-bg)',
          surface: 'var(--app-surface)',
          text: 'var(--app-text)',
          muted: 'var(--app-text-muted)',
          border: 'var(--app-border)',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          text: '#f8fafc',
          textMuted: '#94a3b8'
        }
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
