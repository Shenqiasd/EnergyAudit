import type { NextConfig } from "next";

let apiUrl = process.env.INTERNAL_API_URL || "http://localhost:3001";
if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = `http://${apiUrl}`;
}

const nextConfig: NextConfig = {
  experimental: {
    prerenderEarlyExit: false,
  },
  serverExternalPackages: [
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-select",
    "@radix-ui/react-toast",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-popover",
    "@radix-ui/react-switch",
    "@radix-ui/react-avatar",
    "@radix-ui/react-progress",
  ],
  allowedDevOrigins: [
    "*.replit.dev",
    "*.repl.co",
    "*.worf.replit.dev",
    "*.worf.repl.co",
    "*.repl.co:5000",
    "*.replit.dev:5000",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },
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
