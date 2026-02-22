import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
// This is a vanilla JS multi-page app, no React
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        worker: resolve(__dirname, 'worker-dashboard.html'),
        employer: resolve(__dirname, 'employer-dashboard.html'),
      }
    }
  }
})
