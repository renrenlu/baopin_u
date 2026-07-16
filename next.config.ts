import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "fangge";
const basePath = isGitHubPages ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath,
  assetPrefix: basePath,
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: true,
  },
  // The Pages build only exports the app directory. Cloudflare worker files
  // are validated by the existing vinext build instead of Next's type pass.
  typescript: {
    ignoreBuildErrors: isGitHubPages,
  },
};

export default nextConfig;
