import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude @opentelemetry/api from the server/edge bundle.
  // This package is a transitive dependency of @supabase/ssr but cannot be
  // bundled by Netlify's Edge Functions bundler — marking it external fixes
  // the "Could not resolve @opentelemetry/api" build error.
  serverExternalPackages: ["@opentelemetry/api"],
};

export default nextConfig;
