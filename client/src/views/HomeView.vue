<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { apiGet } from '../api/http'
import { formatDate } from '../utils/formatDate'
import { auth } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const posts = ref([])
const pagination = ref({ page: 1, totalPages: 1, total: 0 })
const loading = ref(true)
const loadError = ref('')

const activeCategory = computed(() => {
  const c = route.query.category
  if (Array.isArray(c)) return (c[0] && String(c[0]).trim()) || ''
  return typeof c === 'string' ? c.trim() : ''
})

const activeTag = computed(() => {
  const t = route.query.tag
  if (Array.isArray(t)) return (t[0] && String(t[0]).trim()) || ''
  return typeof t === 'string' ? t.trim() : ''
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

const hasFilter = computed(() => Boolean(activeCategory.value || activeTag.value || activeSearch.value))

const listTitle = computed(() => {
  if (activeCategory.value) return `分类「${activeCategory.value}」下的文章`
  if (activeTag.value) return `标签「${activeTag.value}」下的文章`
  if (activeSearch.value) return `搜索「${activeSearch.value}」的结果`
  return '最新文章'
})

function buildPostsUrl() {
  const params = new URLSearchParams()
  if (activeCategory.value) params.append('category', activeCategory.value)
  if (activeTag.value) params.append('tag', activeTag.value)
  if (activeSearch.value) params.append('search', activeSearch.value)
  params.append('page', activePage.value)
  params.append('limit', 10)
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
  router.push({ 
    query: { ...route.query, page }, 
    hash: '#posts' 
  })
}

watch(
  () => route.query,
  () => {
    if (route.name === 'home') loadPosts()
  },
  { immediate: true },
)
</script>

<template>
  <div class="home">
    <section class="intro">
      <p class="intro__eyebrow">个人技术随笔</p>
      <h1 class="intro__title">记录学习与构建日常</h1>
      <p class="intro__desc">
        目前已支持 Markdown、评论、搜索、分页、多标签及归档功能。
      </p>
    </section>

    <section id="posts" class="list-section" aria-labelledby="posts-heading">
      <div class="list-section__head">
        <h2 id="posts-heading" class="list-section__title">{{ listTitle }}</h2>
        <span v-if="!loading && !loadError" class="list-section__count">{{ pagination.total }} 篇</span>
      </div>

      <p v-if="hasFilter && !loading" class="list-section__filter-hint">
        当前筛选：
        <strong class="list-section__filter-name">{{ activeCategory || activeTag || activeSearch }}</strong>
        <RouterLink class="list-section__clear" :to="{ path: '/', hash: '#posts' }">查看全部</RouterLink>
      </p>

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
          <p class="state__sub">可以换一个搜索词或分类，或返回查看全部文章。</p>
          <RouterLink class="state__link" :to="{ path: '/', hash: '#posts' }">查看全部</RouterLink>
        </template>
        <template v-else>
          <p class="state__lead">暂无文章</p>
          <p class="state__sub">当前列表为空，可以发布第一篇内容。</p>
          <RouterLink class="state__link" to="/write">去写文章</RouterLink>
        </template>
      </div>

      <div v-else>
        <ul class="cards" role="list">
          <li v-for="post in posts" :key="post.id" class="cards__item">
            <article class="card">
              <div class="card__meta">
                <time class="card__time" :datetime="post.createdAt">{{ formatDate(post.createdAt) }}</time>
                <span v-if="post.category" class="card__cat">{{ post.category }}</span>
                <span v-if="post.status === 'draft'" class="card__badge card__badge--draft">草稿</span>
              </div>
              <h3 class="card__title">
                <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="card__title-link">
                  {{ post.title }}
                </RouterLink>
              </h3>
              <p class="card__excerpt">{{ post.excerpt }}</p>
              <div v-if="post.tags && post.tags.length" class="card__tags">
                <RouterLink v-for="tag in post.tags" :key="tag" :to="{ path: '/', query: { tag }, hash: '#posts' }" class="tag">#{{ tag }}</RouterLink>
              </div>
              <RouterLink class="card__more" :to="{ name: 'post', params: { id: post.id } }">阅读全文</RouterLink>
            </article>
          </li>
        </ul>

        <nav v-if="pagination.totalPages > 1" class="pagination-container" aria-label="分页导航">
          <el-pagination
            v-model:current-page="pagination.page"
            :page-count="pagination.totalPages"
            :total="pagination.total"
            :page-size="10"
            background
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </nav>
      </div>
    </section>
  </div>
</template>

<style scoped>
.intro {
  margin-bottom: 2.75rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.intro__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.intro__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--text);
}

.intro__desc {
  margin: 0;
  max-width: 40rem;
  font-size: 1rem;
  color: var(--text-muted);
}

.list-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.list-section__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.list-section__count {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.list-section__filter-hint {
  margin: -0.5rem 0 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.list-section__filter-name {
  color: var(--text);
  font-weight: 600;
}

.list-section__clear {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: var(--accent);
  text-decoration: none;
}

.list-section__clear:hover {
  text-decoration: underline;
}

.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.card {
  height: 100%;
  padding: 1.25rem 1.35rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: border-color 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  transform: translateY(-2px);
}

.card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.65rem;
}

.card__time {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.card__cat {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
}

.card__badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.card__badge--draft {
  background: #f3f4f6;
  color: #4b5563;
}

.card__title {
  margin: 0 0 0.5rem;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text);
}

.card__title-link {
  color: inherit;
  text-decoration: none;
}

.card__excerpt {
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card__tags {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag {
  font-size: 0.75rem;
  color: var(--accent);
  text-decoration: none;
}

.tag:hover {
  text-decoration: underline;
}

.card__more {
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--accent);
}

.card__more:hover {
  text-decoration: underline;
}

.pagination-container {
  margin-top: 4rem;
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
  margin: 0;
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
</style>
