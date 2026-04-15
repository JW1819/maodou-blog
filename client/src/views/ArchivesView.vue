<script setup>
import { onMounted, ref } from 'vue'
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
    <h1 class="archives__title">文章归档</h1>
    
    <div v-if="loading" class="state state--muted state--loading">
      <span class="ui-spinner"></span>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="error" class="state state--error">
      <p class="state__lead">加载失败</p>
      <p class="state__sub">{{ error }}</p>
    </div>
    
    <div v-else class="archives__list">
      <div v-for="group in archives" :key="group.year + group.month" class="archive-item">
        <span class="archive-item__date">{{ group.year }}年{{ group.month }}月</span>
        <span class="archive-item__count">{{ group.count }} 篇文章</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archives__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.archives__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.archive-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.archive-item__date {
  font-weight: 500;
}

.archive-item__count {
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
