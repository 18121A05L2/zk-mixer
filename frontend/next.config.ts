import type { NextConfig } from "next";
import webpack from "webpack"; // Import webpack

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Only apply polyfills on the client-side, as Node.js Buffer is available on the server
    if (!isServer) {
      // Configure webpack to resolve 'buffer' to the installed 'buffer' package
      config.resolve.fallback = {
        ...config.resolve.fallback, // Preserve existing fallbacks
        buffer: require.resolve("buffer"),
        // You might need to add other polyfills here if @aztec/bb.js uses other Node.js globals
        // For example, if it uses 'process', you would add:
        // process: require.resolve("process/browser"),
        // And install 'process': npm install process
      };

      // Provide the Buffer global for modules that expect it without explicit import
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          // If you need 'process' as a global:
          // process: "process/browser",
        })
      );
    }

    return config;
  },
};

export default nextConfig;
