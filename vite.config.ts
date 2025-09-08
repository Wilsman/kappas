import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Raise the warning threshold to avoid noisy large-chunk warnings.
    // This does not change runtime behavior; it only silences the warning.
    chunkSizeWarningLimit: 1000,
  },
});
