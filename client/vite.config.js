import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'child_process'

// 获取 Git 提交信息
let commitHash = 'unknown'
let commitMessage = 'unknown'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
  commitMessage = execSync('git log -1 --pretty=%B').toString().trim()
} catch (e) {
  console.warn('Failed to get git info:', e.message)
}

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(Date.now()),
    __GIT_COMMIT__: JSON.stringify(commitHash),
    __GIT_MESSAGE__: JSON.stringify(commitMessage)
  }
})
