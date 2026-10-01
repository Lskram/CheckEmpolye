/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/console/:path*',
        destination: '/admin',
      },
    ];
  },
};

export default nextConfig;
