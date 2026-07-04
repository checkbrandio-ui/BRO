import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { cpSync, writeFileSync } from 'fs'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      closeBundle() {
        try {
          // GitHub Pages SPA fallback: index.html as 404.html
          cpSync('dist/index.html', 'dist/404.html', { force: true });
          // Prevent Jekyll processing (GitHub Pages uses Jekyll by default)
          writeFileSync('dist/.nojekyll', '');
          // _redirects for Netlify/Cloudflare Pages compatibility
          writeFileSync('dist/_redirects', '/* /index.html 200\n');
        } catch (_) {}
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
