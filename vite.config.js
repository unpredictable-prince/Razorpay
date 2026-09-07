import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for single unified RecoverAI & Aura Store platform
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
