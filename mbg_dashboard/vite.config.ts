import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const legacyWaterEndpoint = env.VITE_WATER_ENDPOINT
  const esp32BaseUrl = (
    env.VITE_ESP32_URL ||
    (legacyWaterEndpoint ? legacyWaterEndpoint.replace(/\/water-now\/?$/, '') : undefined) ||
    'http://10.0.0.192'
  ).replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['mybalconygardener.boileragency.com'],
      proxy: {
        '/logs': {
          target: esp32BaseUrl,
          changeOrigin: true,
          rewrite: (path) => path
        },
        '/water-now': {
          target: esp32BaseUrl,
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    }
  }
})
