import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssnano from 'cssnano'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    // 禁用 Lightning CSS 压缩，由 postcss cssnano 处理
    cssMinify: false,
  },
  css: {
    postcss: {
      plugins: [
        cssnano({
          preset: [
            'default',
            {
              // 禁用将 max-width 转换为 width<=x 的非标准语法
              // 荣耀浏览器等不支持
              convert: {
                mediaqueries: false,
              },
            },
          ],
        }),
      ],
    },
  },
})
