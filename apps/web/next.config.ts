import type { NextConfig } from "next";

// Use INTERNAL_API_URL from Railway service reference or fallback to localhost
const apiUrl = process.env.INTERNAL_API_URL || "http://localhost:3001";

// Ensure URL has protocol
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
