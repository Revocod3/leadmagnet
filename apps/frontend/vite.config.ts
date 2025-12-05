import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['dev.objetivovientreplano.com', 'chat.objetivovientreplano.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
    host: true,
    strictPort: true,
    allowedHosts: ['dev.objetivovientreplano.com', 'chat.objetivovientreplano.com', 'localhost'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})