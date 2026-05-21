import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.externals.push(
      ...Object.keys(require("@chuangshizhe/database/client-core/package.json").dependencies || {}),
      ...Object.keys(require("@chuangshizhe/database/client-ip/package.json").dependencies || {}),
      ...Object.keys(require("@chuangshizhe/database/client-edu/package.json").dependencies || {}),
    )
    return config
  },
}

export default nextConfig
