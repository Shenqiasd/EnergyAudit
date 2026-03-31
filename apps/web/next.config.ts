import type { NextConfig } from "next";

let apiUrl = process.env.INTERNAL_API_URL || "http://localhost:3001";
if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = `http://${apiUrl}`;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.replit.dev",
    "*.repl.co",
    "*.worf.replit.dev",
    "*.worf.repl.co",
    "*.repl.co:5000",
    "*.replit.dev:5000",
  ],
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
