import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: [
        /(^|\/)\.git\//,
        /(^|\/)node_modules\//,
        /(^|\/)dist\//,
        /(^|\/)build\//,
      ],
    },
  },
});

