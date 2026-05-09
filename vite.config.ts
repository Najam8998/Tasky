import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'buffer-polyfill',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head><script>window.global = window; window.process = { env: {} };</script>`
        )
      },
    },
  ],
  define: {
    global: 'globalThis',
    'process.env': '{}',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
