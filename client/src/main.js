import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')

// 添加全局变量
window.__BUILD_TIME__ = __BUILD_TIME__
window.__VERSION__ = __VERSION__
window.__GIT_COMMIT__ = __GIT_COMMIT__
window.__GIT_MESSAGE__ = __GIT_MESSAGE__

// 添加控制台命令
window.version = function() {
  console.log('=== 项目版本信息 ===')
  console.log(`部署时间: ${new Date(__BUILD_TIME__).toLocaleString()}`)
  console.log(`版本号: ${__VERSION__}`)
  console.log(`Git 提交: ${__GIT_COMMIT__}`)
  console.log(`提交信息: ${__GIT_MESSAGE__}`)
  console.log('=================')
}
