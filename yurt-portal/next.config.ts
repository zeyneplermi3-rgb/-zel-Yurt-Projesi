import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "leave-computing-expert-helmet.trycloudflare.com",
    "*.trycloudflare.com",
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.1.5:3000",
  ],
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
