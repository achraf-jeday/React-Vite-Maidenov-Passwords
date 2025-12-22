import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine backend URL based on environment
// In Docker: use service name 'drupal'
// On host: use localhost:8080
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://drupal:80'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Required for Docker: listen on all interfaces
    host: '0.0.0.0',
    port: 5173,
    // Enable CORS
    cors: true,
    // Watch options for better performance in Docker
    watch: {
      usePolling: true,
      interval: 1000
    },
    // HMR (Hot Module Replacement) configuration for Docker
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws'
    },
    // Proxy configuration for API requests
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false
        // No rewrite needed - keep /api prefix for Drupal endpoints
      },
      '/oauth': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false
      },
      '/jsonapi': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Preview server configuration (for production build testing)
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})
