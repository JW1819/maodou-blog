<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { apiGet } from '../api/http'

const archives = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await apiGet('/api/posts/archives')
    archives.value = data.items || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="archives">
    <section class="archives__hero">
      <p class="archives__eyebrow">Archives</p>
      <h1 class="archives__title">文章归档</h1>
      <p class="archives__desc">按月份浏览所有文章，快速定位你想找的内容。</p>
    </section>

    <div
      v-if="loading"
      class="state state--muted state--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span class="ui-spinner" aria-hidden="true" />
      <span>正在加载归档…</span>
    </div>

    <div v-else-if="error" class="state state--error" role="alert">
      <p class="state__lead">加载失败</p>
      <p class="state__sub">{{ error }}</p>
    </div>

    <div v-else-if="archives.length === 0" class="state state--muted">
      <p class="state__lead">暂无归档</p>
    </div>

    <ul v-else class="archive-list" role="list">
      <li v-for="group in archives" :key="group.year + group.month" class="archive-card">
        <RouterLink class="archive-card__link" :to="{ path: '/posts', query: { search: `${group.year}年${group.month}月` } }">
          <div class="archive-card__date">
            <span class="archive-card__year">{{ group.year }}</span>
            <span class="archive-card__month">{{ group.month }}月</span>
          </div>
          <div class="archive-card__info">
            <span class="archive-card__count">{{ group.count }} 篇文章</span>
            <span class="archive-card__arrow" aria-hidden="true">→</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.archives {
  max-width: 680px;
  margin: 0 auto;
}

.archives__hero {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.archives__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.archives__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
}

.archives__desc {
  margin: 0;
  max-width: 40rem;
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.archive-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.archive-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.archive-card:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  transform: translateY(-1px);
}

.archive-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  text-decoration: none;
  color: var(--text);
}

.archive-card__link:hover {
  text-decoration: none;
}

.archive-card__date {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.archive-card__year {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.archive-card__month {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text);
}

.archive-card__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.archive-card__count {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.archive-card__arrow {
  font-size: 1rem;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.archive-card:hover .archive-card__arrow {
  opacity: 1;
  transform: translateX(0);
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

@media (max-width: 600px) {
  .archive-card__link {
    padding: 1rem;
  }

  .archive-card__year {
    font-size: 1.125rem;
  }
}
</style>
