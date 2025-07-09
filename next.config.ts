/** @type {import('next').NextConfig} */
const path = require('path');

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,   // <-- dòng “thần thánh”
  },
};
module.exports = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },

  webpack(config) {
    // alias ffmpeg-core.js  →  tránh lỗi module not found
    config.resolve.alias['/node_modules/@ffmpeg/core/dist/ffmpeg-core.js'] =
      path.resolve(
        __dirname,
        'node_modules',
        '@ffmpeg',
        'core',
        'dist',
        'ffmpeg-core.js'
      );

    return config; // KHÔNG thêm experiments.turbo ở đây
  },
};
