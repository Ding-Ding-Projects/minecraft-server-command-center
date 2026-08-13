import type { NextConfig } from "next";

const githubPagesAssetPrefix = "/minecraft-server-command-center";

const nextConfig: NextConfig = {
  // Vinext reads this root next.config.ts during its build decision. Static
  // export produces deployable HTML, JSON, and assets in dist/client.
  output: "export",
  // Vinext prerenders the static root as `/`; assetPrefix keeps every emitted
  // static asset beneath this repository's GitHub Pages project path.
  assetPrefix: githubPagesAssetPrefix,
  trailingSlash: true,
  images: {
    // A static host has no image-optimization endpoint.
    unoptimized: true,
  },
};

export default nextConfig;
