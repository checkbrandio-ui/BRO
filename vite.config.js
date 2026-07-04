import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { cpSync } from 'fs'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // GitHub Pages SPA fallback: index.html as 404.html
        try { cpSync('dist/index.html', 'dist/404.html', { force: true }); } catch (_) {}
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
