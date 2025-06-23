// postcss.config.js
module.exports = {
  plugins: {
    // Sử dụng plugin đã tách riêng cho PostCSS
    '@tailwindcss/postcss': {},
    // Giữ autoprefixer để thêm tiền tố trình duyệt
    autoprefixer: {},
  },
}
