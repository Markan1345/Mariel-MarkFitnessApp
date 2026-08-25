import type { NextConfig } from "next";
import { SITE_BASE_PATH } from "./lib/site";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: SITE_BASE_PATH || undefined,
  assetPrefix: SITE_BASE_PATH || undefined,
};

export default nextConfig;
