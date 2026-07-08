/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          bg: '#fdf6ec',
          card: '#ffffff',
          primary: '#c68642',
          'primary-hover': '#b87736',
          border: '#e6d8c3',
          text: '#3d2f1e',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'focus': '0 0 0 4px rgba(198, 134, 66, 0.25)',
      },
    },
  },
  plugins: [],
}
