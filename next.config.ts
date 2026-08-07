import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Phone camera photos (the scanner's primary input) routinely exceed
      // Next's 1MB default for Server Action bodies.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
