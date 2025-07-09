module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
            code: { whiteSpace: "pre-wrap" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwind-scrollbar")],
};
