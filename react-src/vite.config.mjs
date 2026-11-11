import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Semantic UI is already minified and contains legacy selectors.
  build: { cssMinify: false },
  server: {
    port: 4200,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true }
    }
  },
  test: { environment: 'jsdom', globals: true }
});
