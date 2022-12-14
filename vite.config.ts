import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/peer-link/',
  build: {
    outDir: 'docs',
    assetsDir: './',
  },
  server: {
    host: '0.0.0.0',
    port: 80,
    open: 'https://ff-dev.bilibili.com/',
  },
  plugins: [vue()],
})
