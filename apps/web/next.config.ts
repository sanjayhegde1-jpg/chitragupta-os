import type { NextConfig } from "next";
import path from "path";

// Verification Trigger: Force Frontend Re-Deploy (Dependency Override Check) - Attempt 5

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
  env: {
     // SAFETY LOCK: Force Mock Mode OFF in production builds.
     NEXT_PUBLIC_TEST_MODE: process.env.NODE_ENV === 'production' ? 'false' : process.env.NEXT_PUBLIC_TEST_MODE,
  },
  // Verifying CI Build Hook: Experiment Enabled
  transpilePackages: ['@chitragupta/shared'],
};

export default nextConfig;
