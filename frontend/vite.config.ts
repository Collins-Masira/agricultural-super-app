import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The backend API is developed separately. When the API is live,
      // requests to /api are proxied to the configured backend origin.
      // '/api': {
      //   target: process.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
      //   changeOrigin: true,
      // },
    },
  },
})