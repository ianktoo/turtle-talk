import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "books.disney.com" },
    ],
  },
  turbopack: {
    // Pin the workspace root to this project to avoid Next.js picking up a
    // stray package-lock.json higher up in the directory tree.
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      // Serve v2 as canonical routes (URL stays /, /garden, /talk, /missions)
      { source: "/", destination: "/v2" },
      { source: "/garden", destination: "/v2/garden" },
      { source: "/talk", destination: "/v2/talk" },
      { source: "/missions", destination: "/v2/missions" },
    ];
  },
  async redirects() {
    return [
      // Redirect old /v2/* URLs to canonical paths
      { source: "/v2", destination: "/", permanent: true },
      { source: "/v2/garden", destination: "/garden", permanent: true },
      { source: "/v2/talk", destination: "/talk", permanent: true },
      { source: "/v2/missions", destination: "/missions", permanent: true },
      // Redirect old wish-list/conversation pages to garden (now modals)
      { source: "/wish-list", destination: "/garden", permanent: true },
      { source: "/v2/wish-list", destination: "/garden", permanent: true },
      { source: "/conversation", destination: "/garden", permanent: true },
      { source: "/v2/conversation", destination: "/garden", permanent: true },
      { source: "/appreciation/wish-list", destination: "/garden", permanent: true },
      { source: "/world/wish-list", destination: "/garden", permanent: true },
    ];
  },
};

export default nextConfig;
