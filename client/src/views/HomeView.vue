<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { apiGet } from '../api/http'
import { formatDate } from '../utils/formatDate'

const recentPosts = ref([])
const loading = ref(true)
const RECENT_POSTS_LIMIT = 5

onMounted(async () => {
  try {
    const data = await apiGet(`/api/posts?limit=${RECENT_POSTS_LIMIT}&page=1`)
    recentPosts.value = Array.isArray(data?.items) ? data.items : []
  } catch {
    recentPosts.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__avatar-wrap">
        <img src="/image/user.png" alt="头像" class="hero__avatar" />
      </div>
      <div class="hero__content">
        <p class="hero__eyebrow">Hello, World</p>
        <h1 class="hero__greeting">你好，我是 Nic 👋</h1>
        <p class="hero__desc">
          一名软件开发者，热爱技术与生活。在这里记录学习与构建的日常，分享技术思考与实践心得。
        </p>
      </div>
    </section>

    <section class="recent">
      <div class="recent__head">
        <h2 class="recent__title">最新文章</h2>
        <RouterLink class="recent__more" to="/posts">查看全部 →</RouterLink>
      </div>

      <div
        v-if="loading"
        class="state state--muted state--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="ui-spinner" aria-hidden="true" />
        <span>正在加载…</span>
      </div>

      <div v-else-if="recentPosts.length === 0" class="state state--muted">
        <p class="state__lead">暂无文章</p>
      </div>

      <ul v-else class="recent__list" role="list">
        <li v-for="post in recentPosts" :key="post.id" class="recent__item">
          <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="recent-row">
            <span class="recent-row__time">{{ formatDate(post.createdAt) }}</span>
            <span class="recent-row__title">{{ post.title }}</span>
            <span v-if="post.category" class="recent-row__cat">{{ post.category }}</span>
          </RouterLink>
        </li>
      </ul>

      <RouterLink v-if="recentPosts.length > 0" class="recent__view-all" to="/posts">
        查看更多文章 →
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 680px;
  margin: 0 auto;
}

.hero {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  padding: 2.5rem 2rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
}

.hero__avatar-wrap {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--accent), #52b788);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--surface);
}

.hero__content {
  flex: 1;
  min-width: 0;
}

.hero__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.hero__greeting {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.hero__desc {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--text-muted);
}

.recent {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.75rem;
}

.recent__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.recent__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.recent__more {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
}

.recent__more:hover {
  text-decoration: underline;
}

.recent__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.recent__item {
  border-bottom: 1px solid var(--border);
}

.recent__item:last-child {
  border-bottom: none;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.25rem;
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s ease;
}

.recent-row:hover {
  background: var(--accent-soft);
  border-radius: 6px;
}

.recent-row__time {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 6rem;
}

.recent-row__title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.5;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-row__cat {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
}

.recent__view-all {
  display: block;
  text-align: center;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
}

.recent__view-all:hover {
  text-decoration: underline;
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

.state__lead {
  margin: 0;
  font-weight: 600;
}

@media (max-width: 600px) {
  .hero {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.25rem;
  }

  .recent-row {
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .recent-row__time {
    min-width: auto;
  }

  .recent-row__title {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
}
</style>
