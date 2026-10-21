import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'moxfield-api': fileURLToPath(
        new URL('./node_modules/moxfield-api/dist/moxfield-api.mjs', import.meta.url)
      ),
    },
  },
  server: {
    proxy: {
      '/api/moxfield': {
        target: 'https://api2.moxfield.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moxfield/, ''),
        headers: {
          Origin: 'https://www.moxfield.com',
          Referer: 'https://www.moxfield.com/',
        },
      },
    },
  },
})
