import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    // Brotli compression
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
    // Bundle analyzer (only in analyze mode)
    visualizer({
      open: process.env.ANALYZE === "true",
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: process.env.NODE_ENV === "production" ? "/College_Media/" : "/",
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.config.js",
        "**/*.spec.js",
        "**/*.test.js",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  build: {
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          react: ["react", "react-dom", "react-router-dom"],
          ui: ["lucide-react", "@iconify/react"],
          utils: ["axios", "immer", "use-immer"],
          socket: ["socket.io-client"],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Source maps for production debugging
    sourcemap: false,
  },
  // Performance optimizations
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
