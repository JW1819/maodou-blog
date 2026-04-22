<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { apiGet } from '../api/http'
import { formatDate } from '../utils/formatDate'
import { categoriesStore } from '../stores/categories'

const route = useRoute()
const router = useRouter()
const PAGE_SIZE = 15
const posts = ref([])
const pagination = ref({ page: 1, totalPages: 1, total: 0 })
const loading = ref(true)
const loadError = ref('')

const activeCategory = computed(() => {
  const c = route.query.category
  if (Array.isArray(c)) return (c[0] && String(c[0]).trim()) || ''
  return typeof c === 'string' ? c.trim() : ''
})

const activeSearch = computed(() => {
  const s = route.query.search
  if (Array.isArray(s)) return (s[0] && String(s[0]).trim()) || ''
  return typeof s === 'string' ? s.trim() : ''
})

const activePage = computed(() => {
  const p = route.query.page
  return p ? Number(p) : 1
})

const hasFilter = computed(() => Boolean(activeCategory.value || activeSearch.value))

const listTitle = computed(() => {
  if (activeCategory.value) return `分类「${activeCategory.value}」`
  if (activeSearch.value) return `搜索「${activeSearch.value}」`
  return '全部文章'
})

function buildPostsUrl() {
  const params = new URLSearchParams()
  if (activeCategory.value) params.append('category', activeCategory.value)
  if (activeSearch.value) params.append('search', activeSearch.value)
  params.append('page', activePage.value)
  params.append('limit', PAGE_SIZE)
  return `/api/posts?${params.toString()}`
}

async function loadPosts() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await apiGet(buildPostsUrl())
    posts.value = Array.isArray(data?.items) ? data.items : []
    pagination.value = data.pagination || { page: 1, totalPages: 1, total: 0 }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
    posts.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  router.push({ query: { ...route.query, page } })
}

function selectCategory(cat) {
  const query = { ...route.query }
  if (cat) {
    query.category = cat
  } else {
    delete query.category
  }
  delete query.page
  router.push({ query })
}

watch(
  () => route.query,
  () => {
    if (route.name === 'posts') loadPosts()
  },
  { immediate: true },
)
</script>

<template>
  <div class="posts-page">
    <section class="posts-page__hero">
      <p class="posts-page__eyebrow">Blog</p>
      <div class="posts-page__title-row">
        <h1 class="posts-page__title">{{ listTitle }}</h1>
        <span v-if="!loading && !loadError" class="posts-page__count">共 {{ pagination.total }} 篇</span>
      </div>
    </section>

    <nav class="cat-filter" aria-label="分类筛选">
      <button
        class="cat-filter__btn"
        :class="{ 'cat-filter__btn--active': !activeCategory }"
        @click="selectCategory('')"
      >
        全部
      </button>
      <button
        v-for="c in categoriesStore.items"
        :key="c"
        class="cat-filter__btn"
        :class="{ 'cat-filter__btn--active': activeCategory === c }"
        @click="selectCategory(c)"
      >
        {{ c }}
      </button>
    </nav>

    <div
      v-if="loading"
      class="state state--muted state--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span class="ui-spinner" aria-hidden="true" />
      <span>正在加载文章…</span>
    </div>
    <div v-else-if="loadError" class="state state--error" role="alert">
      <p class="state__lead">请求失败</p>
      <p class="state__sub">{{ loadError }}</p>
    </div>
    <div v-else-if="posts.length === 0" class="state state--muted">
      <template v-if="hasFilter">
        <p class="state__lead">没有找到匹配的文章</p>
        <button class="state__link" @click="selectCategory('')">查看全部</button>
      </template>
      <template v-else>
        <p class="state__lead">暂无文章</p>
      </template>
    </div>

    <template v-else>
      <ul class="post-list" role="list">
        <li v-for="post in posts" :key="post.id" class="post-list__item">
          <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="post-row">
            <span class="post-row__time">{{ formatDate(post.createdAt) }}</span>
            <span class="post-row__title">{{ post.title }}</span>
            <span v-if="post.category" class="post-row__cat">{{ post.category }}</span>
          </RouterLink>
        </li>
      </ul>

      <nav v-if="pagination.totalPages > 1" class="pagination-container" aria-label="分页导航">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-count="pagination.totalPages"
          :total="pagination.total"
          :page-size="PAGE_SIZE"
          background
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </nav>
    </template>
  </div>
</template>

<style scoped>
.posts-page {
  max-width: 680px;
  margin: 0 auto;
}

.posts-page__hero {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.posts-page__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.posts-page__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.posts-page__title {
  margin: 0;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
}

.posts-page__count {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cat-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.cat-filter__btn {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cat-filter__btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.cat-filter__btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.post-list__item {
  border-bottom: 1px solid var(--border);
}

.post-list__item:last-child {
  border-bottom: none;
}

.post-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s ease;
}

.post-row:hover {
  background: var(--accent-soft);
}

.post-row__time {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 6rem;
}

.post-row__title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.5;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-row__cat {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
}

.pagination-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-active):hover) {
  color: var(--accent);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--accent);
}

.state {
  padding: 2rem 1rem;
  text-align: center;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.state--muted {
  color: var(--text-muted);
}

.state--loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.state--error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border: 1px solid rgba(180, 35, 24, 0.1);
}

.state__lead {
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.state__sub {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.state__link {
  display: inline-block;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--accent);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
}

.state__link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .post-row {
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.85rem 1rem;
  }

  .post-row__time {
    min-width: auto;
  }

  .post-row__title {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
}
</style>
