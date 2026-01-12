import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
     // SAFETY LOCK: Force Mock Mode OFF in production builds.
     NEXT_PUBLIC_TEST_MODE: process.env.NODE_ENV === 'production' ? 'false' : process.env.NEXT_PUBLIC_TEST_MODE,
  },
  // Verifying CI Build Hook: Experiment Enabled
};

export default nextConfig;
