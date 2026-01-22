/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "instepanavan.am",
      },
      {
        protocol: "https",
        hostname: "api.instepanavan.am",
      },
    ],
  },
};

module.exports = nextConfig;
