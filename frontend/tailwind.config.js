/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f6fe',
          100: '#ddeafe',
          200: '#c2dbfd',
          300: '#9ac5fb',
          400: '#6ba4f6',
          500: '#4680f0',
          600: '#2f63e4',
          700: '#1d48ce',
          800: '#1e3cb5',
          900: '#193488',
          950: '#0f2052',
        },
        navy: {
          800: '#112240',
          900: '#0a192f',
          950: '#071120',
        },
        accent: {
          saffron: '#d97706',
          emerald: '#059669',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'gov': '0 4px 20px -2px rgba(15, 32, 82, 0.08), 0 2px 6px -1px rgba(15, 32, 82, 0.04)',
        'gov-hover': '0 10px 25px -3px rgba(15, 32, 82, 0.12), 0 4px 10px -2px rgba(15, 32, 82, 0.06)',
      }
    },
  },
  plugins: [],
}
