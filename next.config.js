/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode:false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com',
        port: '',
        pathname: '/premierleague/photos/players/**',
      },
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com',
        port: '',
        pathname: '/premierleague/badges/**',
      },
      {
        protocol: 'https',
        hostname: 'fantasy.premierleague.com',
        port: '',
        pathname: '/img/flags/**',
      }
    ],
  },
};

module.exports = nextConfig;
