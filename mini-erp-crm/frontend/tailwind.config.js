/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // "brand" = Ink Navy, used by shared .btn-primary / links / sidebar
        brand: {
          50: '#EEF1F6',
          100: '#DCE2EC',
          400: '#4A5D82',
          500: '#2C3E60',
          600: '#1B2A4A',
          700: '#141F38',
          900: '#0C1526',
        },
        paper: {
          DEFAULT: '#EDEEE7',
          card: '#F7F7F2',
        },
        amber: {
          DEFAULT: '#D98E1F',
          dark: '#B6740F',
        },
        stamp: {
          green: '#3C6E47',
          red: '#A83B32',
          slate: '#5B6472',
        },
        rule: '#D8D4C6',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
