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
        parchment: {
          50: '#FBF9F4',
          100: '#F6F2E9',
          200: '#ECE3D0',
          300: '#DDD0B2',
          400: '#C7B58E',
          500: '#AE986F',
          600: '#8E7954',
          700: '#6E5D3E',
          800: '#53462E',
          900: '#3D3320',
        },
        gold: {
          400: '#FCE694',
          500: '#EAB347',
          600: '#D4952A',
          700: '#9E6714',
        }
      },
    },
  },
  plugins: [],
};
