/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ff66',
          cyan: '#00f0ff',
          red: '#ff0055',
          gold: '#ffd700'
        },
        fifa: {
          dark: '#0a0e17',
          card: '#111827',
          panel: '#161f30',
          border: '#1f293d',
          accent: '#00e676'
        }
      },
      fontFamily: {
        digital: ['"Orbitron"', 'monospace', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
