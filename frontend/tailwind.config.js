/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jira: {
          blue: {
            DEFAULT: '#1868DB',
            hover: '#1455B3',
            dark: '#0F428D',
            light: '#EBF3FC',
            subtle: '#F0F6FE',
          },
          accent: {
            orange: '#FF991F',
            orangeHover: '#DE7000',
            yellow: '#FFAB00',
          },
          gray: {
            50: '#FAFBFC',
            100: '#F4F5F7',
            200: '#EBECF0',
            300: '#DFE1E6',
            400: '#C1C7D0',
            500: '#8993A4',
            600: '#6B778C',
            700: '#42526E',
            800: '#253858',
            900: '#172B4D',
          },
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        modal: '0 8px 30px rgba(0, 0, 0, 0.12)',
        dropdown: '0 4px 12px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)',
      },
    },
  },
  plugins: [],
};
