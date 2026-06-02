import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Skip TS errors during build — monorepo workspace files get picked up
  // by Next.js TS checker (e.g. prisma.config.ts imports "prisma/config")
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
