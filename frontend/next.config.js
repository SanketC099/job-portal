const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: path.resolve(__dirname, ".."),
  },
  async rewrites() {
    // Only proxy to an external backend when BACKEND_API_URL is explicitly set.
    // Otherwise, use native Next.js serverless route handlers under /api/*.
    if (process.env.BACKEND_API_URL) {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.BACKEND_API_URL.replace(/\/$/, "")}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
