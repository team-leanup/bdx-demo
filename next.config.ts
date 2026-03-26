import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.0.93'],
  async rewrites() {
    return [
      { source: '/guide', destination: '/guide.html' },
    ]
  },
}

export default nextConfig
