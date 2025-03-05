/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#001a26",
          50: "#dfecf7",
          100: "#b9ceda",
          200: "#94acbc",
          300: "#6d8c9f",
          400: "#527589",
          500: "#355e75",
          600: "#2a5165",
          700: "#1d3f50",
          800: "#0f2d3c",
          900: "#001a26",
        },
        primary: {
          DEFAULT: '#ffd772',
          50: '#fff9eb',
          100: '#ffefc6',
          200: '#ffd772',
          300: '#ffc64a',
          400: '#ffae20',
          500: '#f98b07',
          600: '#dd6502',
          700: '#b74406',
          800: '#94340c',
          900: '#7a2b0d',
          950: '#461402',
        },
      }
    },
  },
  plugins: [],
}
