import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redis is the shared cache. Keep Next from retaining another large cache in
  // each Railway process.
  cacheMaxMemorySize: 0,
  // Cloudflare handles response compression at the edge. This also avoids
  // retaining origin-side zlib state when a client disconnects mid-response.
  compress: false,
  serverExternalPackages: ["@takumi-rs/core"],
  async rewrites() {
    if (
      !process.env.NEXT_PUBLIC_POSTHOG_HOST ||
      !process.env.NEXT_PUBLIC_POSTHOG_HOST_ASSETS
    ) {
      return [];
    }
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST_ASSETS}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/:path*`,
      },
      {
        source: "/ingest/decide",
        destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/decide`,
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
