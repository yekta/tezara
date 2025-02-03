import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
