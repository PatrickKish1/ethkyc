import { fileURLToPath } from "url";
import { dirname, join } from "path";
import webpack from "webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  webpack: (config, { isServer }) => {
    // Fix Buffer serialization issues
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Exclude problematic Node.js modules and files
    config.externals.push({
      "@tensorflow/tfjs-node": "commonjs @tensorflow/tfjs-node",
      "@mapbox/node-pre-gyp": "commonjs @mapbox/node-pre-gyp",
      canvas: "commonjs canvas",
      sharp: "commonjs sharp",
    });

    // Handle @vladmandic/human for SSR
    if (isServer) {
      config.externals.push({
        "@vladmandic/human": "commonjs @vladmandic/human",
      });
    }

    // Ignore HTML files and other non-JS assets that cause issues
    config.module.rules.push({
      test: /\.html$/,
      use: "ignore-loader",
    });

    // Ignore specific problematic files and modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/.*\.html$/,
        contextRegExp: /@mapbox\/node-pre-gyp/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/.*\.node$/,
        contextRegExp: /@tensorflow\/tfjs-node/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^sharp$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/.*\.html$/,
        contextRegExp: /@vladmandic\/human/,
      }),
    );

    // Fix Buffer polyfill for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: false,
        crypto: false,
        stream: false,
        util: false,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false,
        sharp: false,
        "@tensorflow/tfjs-node": false,
        "@mapbox/node-pre-gyp": false,
        "@vladmandic/human": false,
      };
    }

    // Fix webpack cache issues
    config.cache = {
      type: "filesystem",
      buildDependencies: {
        config: [fileURLToPath(import.meta.url)],
      },
      cacheDirectory: join(__dirname, ".next/cache"),
      compression: "gzip",
      maxAge: 172800000, // 2 days
    };

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
