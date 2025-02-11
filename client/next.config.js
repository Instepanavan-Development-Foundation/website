/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'i.pravatar.cc'],
  },
  output: 'standalone',
  // This ensures all pages are treated as dynamic
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig;