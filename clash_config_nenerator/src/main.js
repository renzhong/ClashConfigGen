import { createApp } from 'vue' // 修改导入方式
import App from './App.vue'
import router from './router'
import "./assets/theme-light-grey-blue.css"; // 默认主题
// import "./assets/theme-black-white.css"; // 默认主题

createApp(App).use(router).mount('#app')
