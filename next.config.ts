/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',  // avatar từ Google
      'your-project.supabase.co',   // nếu có dùng Supabase Storage
      'lh3.googleusercontent.com',
// bạn có thể thêm domain khác ở đây
    ],
  },
};

module.exports = nextConfig;
