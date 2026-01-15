import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // For App Router route handlers, FormData handles file uploads via streaming
  // No bodyParser config needed - files are streamed, not buffered
  experimental: {
    proxyClientMaxBodySize: "100mb", // Increase buffer size for proxied requests if needed
  },
  // Large media files are served via API route (/api/media/[id]) to bypass
  // static file size limits in production. The API route supports range requests
  // for video seeking and streams files efficiently.
};

export default nextConfig;
