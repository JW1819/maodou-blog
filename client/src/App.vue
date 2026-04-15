<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { apiGet } from './api/http'
import { auth } from './stores/auth'
import { categoriesStore } from './stores/categories'

const route = useRoute()
const router = useRouter()
const year = computed(() => new Date().getFullYear())

const isDark = ref(localStorage.getItem('theme') === 'dark')

const activeCategory = computed(() => {
  const c = route.query.category
  if (Array.isArray(c)) return (c[0] && String(c[0])) || ''
  return typeof c === 'string' ? c : ''
})

const postsSectionTo = computed(() => {
  const q = activeCategory.value ? { category: activeCategory.value } : {}
  return { path: '/', query: q, hash: '#posts' }
})

const activeHome = computed(() => route.name === 'home' && !activeCategory.value)
const activePosts = computed(() => route.name === 'home' || route.name === 'post')
const activeArchives = computed(() => route.name === 'archives')
const activeWrite = computed(() => route.name === 'write')
const activeAbout = computed(() => route.name === 'about')

const searchQuery = ref('')

function onSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/', query: { search: searchQuery.value.trim() }, hash: '#posts' })
  searchQuery.value = ''
}

function categoryActive(name) {
  return activeCategory.value === name
}

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  localStorage.setItem('theme', theme)
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }
}

function onLogout() {
  auth.logout()
  categoriesStore.fetch() // Refresh to only see published
  router.push('/')
}

onMounted(async () => {
  auth.check()
  // Initialize theme
  const storedTheme = localStorage.getItem('theme')
  const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (storedTheme === 'dark' || (!storedTheme && systemIsDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else if (storedTheme === 'light' || (!storedTheme && !systemIsDark)) {
    isDark.value = false
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }

  categoriesStore.fetch()
})
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header__shell">
        <div class="header__inner header__inner--top">
          <RouterLink class="logo" to="/">毛豆博客</RouterLink>
          <nav class="nav" aria-label="主导航">
            <RouterLink class="nav__link" :class="{ 'nav__link--active': activeHome }" to="/">首页</RouterLink>
            <RouterLink
              class="nav__link"
              :class="{ 'nav__link--active': activePosts }"
              :to="postsSectionTo"
            >
              文章
            </RouterLink>
            <RouterLink class="nav__link" :class="{ 'nav__link--active': activeArchives }" to="/archives">归档</RouterLink>
            <RouterLink v-if="auth.isLoggedIn" class="nav__link" :class="{ 'nav__link--active': activeWrite }" to="/write">写文章</RouterLink>
            <RouterLink class="nav__link" :class="{ 'nav__link--active': activeAbout }" to="/about">关于</RouterLink>
            
            <div class="nav__right">
              <form @submit.prevent="onSearch" class="search-form">
                <input v-model="searchQuery" type="text" placeholder="搜索文章..." class="search-input" />
              </form>
              <button @click="toggleTheme" class="btn-icon" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
                <span v-if="isDark">☀️</span>
                <span v-else>🌙</span>
              </button>
              <template v-if="auth.isLoggedIn">
                <span class="nav__user">{{ auth.user?.username }}</span>
                <button @click="onLogout" class="nav__link btn-logout">退出</button>
              </template>
            </div>
          </nav>
        </div>

        <div class="header__inner header__inner--cats" aria-label="分类筛选区域">
          <span class="nav-cats__label">分类</span>
          <nav class="nav-cats">
            <RouterLink
              class="nav__link"
              :class="{ 'nav__link--active': route.name === 'home' && !activeCategory }"
              :to="{ path: '/', hash: '#posts' }"
            >
              全部
            </RouterLink>
            <RouterLink
              v-for="c in categoriesStore.items"
              :key="c"
              class="nav__link"
              :class="{ 'nav__link--active': categoryActive(c) }"
              :to="{ path: '/', query: { category: c }, hash: '#posts' }"
            >
              {{ c }}
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="footer__inner">
        <p class="footer__copy">© {{ year }} 毛豆博客 · Vue 3 + Express + SQLite</p>
        <div class="footer__links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span class="footer__dot" aria-hidden="true">·</span>
          <RouterLink class="footer__link" to="/">RSS（占位）</RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.header__shell {
  max-width: var(--max);
  margin: 0 auto;
  width: 100%;
}

.header__inner {
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.header__inner--top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;
}

.header__inner--cats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  padding-top: 0;
  padding-bottom: 0.65rem;
  border-top: 1px solid var(--border);
}

.nav-cats__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.nav-cats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.logo {
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  color: var(--text);
  text-decoration: none;
}

.logo:hover {
  color: var(--accent);
  text-decoration: none;
}

.nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: flex-end;
}

.nav__link {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav__link:hover {
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
}

.nav__link--active {
  color: var(--accent);
  font-weight: 500;
}

.nav__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--border);
}

.search-form {
  margin-right: 0.5rem;
}

.search-input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  color: var(--text);
  width: 120px;
  transition: width 0.2s ease;
}

.search-input:focus {
  width: 180px;
  outline: none;
  border-color: var(--accent);
}

.nav__user {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 500;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.btn-icon:hover {
  background: var(--accent-soft);
}

.btn-logout {
  cursor: pointer;
  background: none;
  border: none;
  font: inherit;
}

.main {
  flex: 1;
  width: 100%;
  max-width: var(--max);
  margin: 0 auto;
  padding: 2.25rem 1.25rem 3rem;
}

.footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 70%, var(--bg));
}

.footer__inner {
  max-width: var(--max);
  margin: 0 auto;
  padding: 1.35rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}

.footer__copy {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.footer__links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.footer__links a,
.footer__link {
  color: var(--text-muted);
  text-decoration: none;
}

.footer__links a:hover,
.footer__link:hover {
  color: var(--accent);
}

.footer__dot {
  color: var(--border);
  user-select: none;
}
</style>
