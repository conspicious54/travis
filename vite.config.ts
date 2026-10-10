import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    historyApiFallback: true,
  },
  build: {
    // Split big, slow-changing dependencies into their own chunks so
    // navigation between pages reuses the cached vendor bundles, and
    // code changes to our own pages don't bust the vendor caches.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
    // Pages are code-split via React.lazy in App.tsx, so each
    // route-chunk comfortably fits under the default 500 KB warning.
    // Keep the threshold strict so a regression (e.g. an eager import
    // sneaking back in) actually trips the warning in CI/build logs.
    chunkSizeWarningLimit: 500,
  },
});
