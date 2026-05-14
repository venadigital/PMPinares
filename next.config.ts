import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "250mb"
    }
  }
};

export default nextConfig;
