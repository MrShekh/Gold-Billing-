import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes need dynamic rendering — static export disabled
  images: { unoptimized: true },
};

export default nextConfig;
