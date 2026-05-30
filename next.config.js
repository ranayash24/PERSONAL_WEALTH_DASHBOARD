/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NEXTAUTH_URL
        ? [new URL(process.env.NEXTAUTH_URL).host, 'localhost:3000']
        : ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
