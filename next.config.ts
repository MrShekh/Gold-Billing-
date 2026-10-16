import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes need dynamic rendering — static export disabled
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // Service worker must never be cached so new deployments update it.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Offline fallback is revalidated so it stays in sync with the SW version.
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
      {
        // Never let browsers/proxies store authenticated API responses.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
