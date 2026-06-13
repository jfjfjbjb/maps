import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: './',
  plugins: [vue(), cesium(), basicSsl()],
  server: {
    host: '0.0.0.0',
    https: true,
  }
})
