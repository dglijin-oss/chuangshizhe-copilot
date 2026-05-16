import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 仅用于生产部署（Docker），开发模式不需要
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
};

export default nextConfig;
