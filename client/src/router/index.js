import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PostsView from '../views/PostsView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import WriteView from '../views/WriteView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import ArchivesView from '../views/ArchivesView.vue'
import GuestbookView from '../views/GuestbookView.vue'
import { auth } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '首页' } },
    { path: '/posts', name: 'posts', component: PostsView, meta: { title: '文章' } },
    { path: '/posts/:id', name: 'post', component: PostDetailView, meta: { title: '文章' } },
    { path: '/posts/:id/edit', name: 'edit', component: WriteView, meta: { title: '编辑文章', requiresAuth: true } },
    { path: '/write', name: 'write', component: WriteView, meta: { title: '写文章', requiresAuth: true } },
    { path: '/chenjiwei-entrance', name: 'login', component: LoginView, meta: { title: '登录' } },
    { path: '/archives', name: 'archives', component: ArchivesView, meta: { title: '归档' } },
    { path: '/guestbook', name: 'guestbook', component: GuestbookView, meta: { title: '留言板' } },
    { path: '/about', name: 'about', component: AboutView, meta: { title: '关于' } },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    await auth.check()
    if (!auth.isLoggedIn) {
      return next({ name: 'login' })
    }
  }
  next()
})

router.afterEach((to) => {
  const suffix = to.meta?.title ? ` · ${to.meta.title}` : ''
  document.title = `毛豆博客${suffix}`
})
