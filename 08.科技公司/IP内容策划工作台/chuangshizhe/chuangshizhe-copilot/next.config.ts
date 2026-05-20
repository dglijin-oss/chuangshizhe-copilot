import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    // Placeholder values for build-time only. Real values come from runtime env.
    DATABASE_URL: "placeholder",
    ALIYUN_API_KEY: "placeholder",
  },
};

export default nextConfig;
