/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#FBF9F5',
          100: '#F5F2EB',
          200: '#EBE5D8',
          300: '#DDD4C0',
          400: '#C2B395',
          500: '#A4906F',
          600: '#867253',
          700: '#69573E',
          800: '#4D3F2D',
          900: '#342A1E',
        },
        brand: {
          amber: '#D97706',
          'amber-hover': '#B45309',
          charcoal: '#1C1917',
          muted: '#78716C',
          border: '#E7E5E4',
          surface: '#FFFFFF',
          bg: '#FAFAF9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '0.75rem',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'lifted': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
