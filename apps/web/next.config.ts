import type { NextConfig } from "next";

let apiUrl = process.env.INTERNAL_API_URL || "http://localhost:3001";
if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = `http://${apiUrl}`;
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
