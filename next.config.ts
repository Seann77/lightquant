import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./src/server/ai/skills/content/**/*"]
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
