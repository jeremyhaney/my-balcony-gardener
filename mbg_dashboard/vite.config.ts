import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['mybalconygardener.boileragency.com'],
    proxy: {
      '/logs': {
        target: process.env.VITE_ESP32_URL || 'http://10.0.0.192',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/water-now': {
        target: process.env.VITE_ESP32_URL || 'http://10.0.0.192',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
