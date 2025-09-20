/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./components/**/*.{js,ts,jsx,tsx,html}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#87CEEB',
          light: '#7DD3FC'
        },
        secondary: {
          light: '#E0F2FE',
          lighter: '#F0F9FF'
        },
        background: {
          main: '#F8FAFC',
          pure: '#FEFEFE'
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          accent: '#7DD3FC'
        },
        status: {
          success: '#10B981',
          positive: '#22C55E',
          warning: '#F59E0B',
          security: '#FB923C',
          info: '#3B82F6'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
