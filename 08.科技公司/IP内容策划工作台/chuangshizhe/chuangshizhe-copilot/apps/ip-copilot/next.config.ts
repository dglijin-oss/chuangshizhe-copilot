import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/*", "@chuangshizhe/database"],
};

export default nextConfig;
