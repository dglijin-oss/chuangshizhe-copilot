import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/*", "@chuangshizhe/database"],
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const prismaDir = path.resolve(__dirname, "../../packages/database");
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
