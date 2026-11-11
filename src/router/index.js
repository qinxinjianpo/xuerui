import { createRouter, createWebHistory } from 'vue-router'
import NavHomeView from '../views/NavHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NavHomeView
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { title: '管理后台' }
    }
  ]
})

// 只给声明了 meta.title 的页面写标题；首页标题由 useNavigation 按后台配置写入，
// 这里不做兜底，避免路由跳转的一瞬间闪出写死的站点名
router.beforeEach((to) => {
  if (to.meta?.title) document.title = to.meta.title
})

export default router
