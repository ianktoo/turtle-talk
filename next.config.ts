import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project to avoid Next.js picking up a
    // stray package-lock.json higher up in the directory tree.
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      // Serve v2 as canonical routes (URL stays /, /garden, /talk, /missions, /wish-list)
      { source: "/", destination: "/v2" },
      { source: "/garden", destination: "/v2/garden" },
      { source: "/talk", destination: "/v2/talk" },
      { source: "/missions", destination: "/v2/missions" },
      { source: "/wish-list", destination: "/v2/wish-list" },
      { source: "/conversation", destination: "/v2/conversation" },
    ];
  },
  async redirects() {
    return [
      // Redirect old /v2/* URLs to canonical paths
      { source: "/v2", destination: "/", permanent: true },
      { source: "/v2/garden", destination: "/garden", permanent: true },
      { source: "/v2/talk", destination: "/talk", permanent: true },
      { source: "/v2/missions", destination: "/missions", permanent: true },
      { source: "/v2/wish-list", destination: "/wish-list", permanent: true },
      { source: "/v2/conversation", destination: "/conversation", permanent: true },
      // Redirect old wish list routes to v2 canonical
      { source: "/appreciation/wish-list", destination: "/wish-list", permanent: true },
      { source: "/world/wish-list", destination: "/wish-list", permanent: true },
    ];
  },
};

export default nextConfig;
