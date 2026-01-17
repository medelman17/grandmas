import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Optimize barrel file imports for faster cold starts and smaller bundles
    // framer-motion has ~1,500+ modules - this ensures tree-shaking works properly
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
