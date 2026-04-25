import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

const plugins = [react()];

if (process.env.SENTRY_AUTH_TOKEN) {
  plugins.push(
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      reactComponentAnnotation: {
        enabled: true,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ["dist/**/*.map"],
      },
    }),
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  server: {
    headers: {
      "Document-Policy": "js-profiling",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: "hidden",
    // Raise the warning threshold to avoid noisy large-chunk warnings.
    // This does not change runtime behavior; it only silences the warning.
    chunkSizeWarningLimit: 1000,
  },
});
