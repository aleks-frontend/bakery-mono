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
          bg: '#fbf3e7',
          'bg-soft': '#f5ebda',
          card: '#fffefb',
          primary: '#c4703b',
          'primary-hover': '#ad5f2e',
          secondary: '#7c8b6f',
          'secondary-soft': '#e9ede4',
          highlight: '#e7be97',
          'highlight-soft': '#f6ead2',
          destructive: '#b3452c',
          'destructive-soft': '#f5ded6',
          border: '#e6d5be',
          text: '#362617',
        },
      },
      fontFamily: {
        sans: ['"Work Sans"', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      boxShadow: {
        'focus': '0 0 0 4px rgba(196, 112, 59, 0.25)',
        'bakery': '0 1px 2px rgba(54, 38, 23, 0.06), 0 8px 24px -8px rgba(54, 38, 23, 0.18)',
      },
    },
  },
  plugins: [],
}
