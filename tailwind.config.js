/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandYellow: "#FFC40C",
        navText: "#333333",
      },
      spacing: {
        header: "5rem",   // 80 px
        navGap: "3rem",   // 48 px
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
