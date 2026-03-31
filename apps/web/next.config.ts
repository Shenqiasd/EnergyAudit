import type { NextConfig } from "next";

// Railway provides RAILWAY_PRIVATE_DOMAIN for internal service communication
const apiUrl = process.env.RAILWAY_PRIVATE_DOMAIN
  ? `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:3001`
  : process.env.INTERNAL_API_URL || "http://localhost:3001";

// Ensure URL has protocol if INTERNAL_API_URL is used
const finalApiUrl = apiUrl.startsWith('http://') || apiUrl.startsWith('https://')
  ? apiUrl
  : `http://${apiUrl}`;

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${finalApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
