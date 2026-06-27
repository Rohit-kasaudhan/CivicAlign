/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'civic-blue': '#1A3A6B',
        'civic-green': '#10B981',
        'civic-teal': '#0F7B6C',
        'civic-saffron': '#F5A623',
        'civic-amber': '#F5A623',
        'civic-red': '#C0392B',
        'civic-bg': '#F4F6FA',
        'civic-surface': '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#5A6A7A',
        'border-color': '#DDE3ED',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
