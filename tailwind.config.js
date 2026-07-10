/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: '#004ac6',
        background: '#f7f9fb',
        surface: '#ffffff',
      },
      boxShadow: {
        'ambient': '0 4px 20px rgba(30, 41, 59, 0.06)',
      }
    },
  },
  plugins: [],
}
