import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // Required for Capacitor (static HTML export)
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
