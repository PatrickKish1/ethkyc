/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@unikyc/sdk'],
}

module.exports = nextConfig
