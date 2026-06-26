/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'civic-blue': '#1e40af',
        'civic-green': '#15803d',
        'civic-amber': '#b45309',
        'civic-red': '#b91c1c',
      }
    },
  },
  plugins: [],
}
