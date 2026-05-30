/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.VERCEL_URL
        ? [process.env.VERCEL_URL, 'localhost:3000']
        : ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
