import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.0.93'],
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'qrcode.react'],
  },
}

export default nextConfig
