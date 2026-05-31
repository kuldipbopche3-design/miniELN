import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Exclude @opentelemetry/api from the server/edge bundle.
  // This package is a transitive dependency of @supabase/ssr but cannot be
  // bundled by Netlify's Edge Functions bundler — marking it external fixes
  // the "Could not resolve @opentelemetry/api" build error.
  serverExternalPackages: ["@opentelemetry/api"],

  // Fix: multiple lockfiles warning — explicitly set Turbopack root to this project
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
