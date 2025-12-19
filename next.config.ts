import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables React's Strict Mode for highlighting potential issues
  output: "standalone", // Required for Docker deployment to bundle dependencies
};

export default nextConfig;
