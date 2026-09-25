import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api/* to the local Express backend (server/generate.js)
// so the frontend never talks to Gemini directly and never sees the API key.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
