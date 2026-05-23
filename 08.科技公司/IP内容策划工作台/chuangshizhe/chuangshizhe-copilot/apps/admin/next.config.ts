import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@chuangshizhe/auth", "@chuangshizhe/billing"],
  serverExternalPackages: ["@prisma/*", "@chuangshizhe/database"],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Resolve workspace packages to their source files
    const packagesDir = path.resolve(__dirname, "../../packages");
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@chuangshizhe/auth"] = path.resolve(packagesDir, "auth/index.ts");
    config.resolve.alias["@chuangshizhe/billing"] = path.resolve(packagesDir, "billing/index.ts");

    if (isServer) {
      const prismaDir = path.resolve(packagesDir, "database");
      config.externals = config.externals || [];
      config.externals.push(
        "@chuangshizhe/database",
        "@chuangshizhe/database/client-core",
        "@chuangshizhe/database/client-ip",
        "@prisma/client",
        "@prisma/adapter-pg",
        prismaDir,
        `${prismaDir}/client-core`,
        `${prismaDir}/client-ip`,
      );
    }
    return config;
  },
};

export default nextConfig;
