// next.config.js
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ───────────────────────── Base ───────────────────────── */
  reactStrictMode: true,

  /* ───────────────────────── ESLint / TS ────────────────── */
  eslint: { ignoreDuringBuilds: true },   // bỏ lint khi build CI
  typescript: { ignoreBuildErrors: true },// bỏ lỗi TS (dọn sau)

  /* ───────────────────────── Images ─────────────────────── */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // cho phép mọi domain (có thể thu hẹp sau)
        pathname: '/**',
      },
    ],
  },

  /* ───────────────────────── Webpack ────────────────────── */
  webpack(config) {
    // Alias ffmpeg-core để tránh lỗi "module not found" ở runtime
    config.resolve.alias[
      '/node_modules/@ffmpeg/core/dist/ffmpeg-core.js'
    ] = path.resolve(
      __dirname,
      'node_modules',
      '@ffmpeg',
      'core',
      'dist',
      'ffmpeg-core.js'
    );

    // 👉 Nếu cần thêm alias khác, đặt bên dưới

    return config;
  },
};

module.exports = nextConfig;
