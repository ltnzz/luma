import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'maplibre-vendor',
              test: /node_modules[\\/]maplibre-gl[\\/]/,
              priority: 20,
            },
            {
              name: 'charts-vendor',
              test: /node_modules[\\/](apexcharts|react-apexcharts)[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
