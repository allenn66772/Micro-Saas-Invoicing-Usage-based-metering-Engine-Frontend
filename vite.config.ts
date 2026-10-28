import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendTarget = 'https://micro-saas-invoicing-usage-based.onrender.com'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
