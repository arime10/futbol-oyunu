/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#0a0f18',
          card: '#111827',
          surface: '#1e293b',
          border: '#334155',
          accent: '#10b981',
          gold: '#f59e0b',
          crimson: '#ef4444',
          sky: '#38bdf8'
        }
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'voice-wave': 'wave 1.2s ease-in-out infinite'
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.25)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
