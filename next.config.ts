import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Public, no-login page: interactive 3D model + 2D plan of the utility room
      { source: "/utility", destination: "/utility-measurements.html" },
    ];
  },
};

export default nextConfig;
