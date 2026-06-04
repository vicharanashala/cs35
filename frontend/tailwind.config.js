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
        // AskSam design palette — soft beige, charcoal, muted brown
        sand: {
          50:  '#faf8f5',
          100: '#f5f0e8',
          200: '#ede4d4',
          300: '#e2d4bc',
          400: '#d4c1a1',
        },
        charcoal: {
          50:  '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#3d3d3d',
          900: '#2b2b2b',
        },
        brown: {
          100: '#e8ddd0',
          200: '#d4c4ae',
          300: '#bfa88c',
          400: '#a89070',
          500: '#967a58',
          600: '#7d6348',
          700: '#634f3c',
          800: '#4d3e30',
          900: '#3a3026',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}