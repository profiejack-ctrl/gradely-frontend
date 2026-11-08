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
        gradely: {
          bg: '#090E17',
          card: '#0D1525',
          cardHover: '#131F35',
          surface: '#111A2D',
          border: '#1E293B',
          borderLight: '#334155',
          primary: '#0284C7',
          primaryHover: '#0369A1',
          secondary: '#65A30D',
          secondaryHover: '#4D7C0F',
          tertiary: '#0EA5E9',
          accent: '#38BDF8',
          textMuted: '#94A3B8',
          textSubtle: '#64748B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px -3px rgba(2, 132, 199, 0.25)',
        glowGreen: '0 0 20px -3px rgba(101, 163, 13, 0.25)',
      },
    },
  },
  plugins: [],
};
