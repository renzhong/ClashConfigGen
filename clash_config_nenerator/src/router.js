import { createRouter, createWebHistory } from 'vue-router'
import IndexPage from './components/IndexPage.vue'

// 定义路由配置
const routes = [
  {
    path: '/',
    name: 'IndexPage',
    component: IndexPage
  }
  // ...其他路由
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
