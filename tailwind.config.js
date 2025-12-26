/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        university: {
          primary: '#1e3a5f',
          secondary: '#2c5282',
          accent: '#3182ce',
          light: '#ebf8ff',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      }
    },
  },
  plugins: [],
}
