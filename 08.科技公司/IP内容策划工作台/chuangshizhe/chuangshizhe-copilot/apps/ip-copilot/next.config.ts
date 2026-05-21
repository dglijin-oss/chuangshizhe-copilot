import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Use Turbopack with empty config (silences warning).
  // Prisma is externalized via serverExternalPackages + webpack config
  // when building with `next build --webpack`.
  turbopack: {},
  // Externalize Prisma from the server bundle
  serverExternalPackages: ["@prisma/*", "@chuangshizhe/database"],
  // Skip TS errors during build — monorepo workspace files get picked up
  // by Next.js TS checker (e.g. prisma.config.ts imports "prisma/config")
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure ALL Prisma runtime paths are externalized
      const prismaDir = path.resolve(__dirname, "../../packages/database");
      config.externals = config.externals || [];
      config.externals.push(
        // By package name (node_modules resolution)
        "@chuangshizhe/database",
        "@chuangshizhe/database/client-core",
        "@chuangshizhe/database/client-ip",
        "@prisma/client",
        "@prisma/adapter-pg",
        // By absolute path (workspace symlink resolution)
        prismaDir,
        // Prisma runtime files
        `${prismaDir}/client-core`,
        `${prismaDir}/client-ip`,
      );
    }
    return config;
  },
};

export default nextConfig;
