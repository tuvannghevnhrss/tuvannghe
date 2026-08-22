// next.config.js
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ───────────────────────── Base ───────────────────────── */
  reactStrictMode: true,

  /* ───────────────────────── ESLint / TS ────────────────── */
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  /* ───────────────────────── Experimental ───────────────── */
  experimental: {
    // Tree-shake icon/chart libraries — chỉ bundle icon/component thực sự dùng
    optimizePackageImports: [
      '@heroicons/react',
      'recharts',
      'react-chartjs-2',
      'chart.js',
      'lucide-react',
    ],
  },

  /* ───────────────────────── Images ─────────────────────── */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },

  /* ───────────────────────── Webpack ────────────────────── */
  webpack(config: any) {
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
