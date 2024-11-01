// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        result: resolve(__dirname, 'result.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
})
