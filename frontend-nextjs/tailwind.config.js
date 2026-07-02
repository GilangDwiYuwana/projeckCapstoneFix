/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        honda: { red: '#CC0000', darkred: '#A00000', lightred: '#FF1A1A' },
        slate: { 950: '#0A0F1C' }
      }
    },
  },
  plugins: [],
};