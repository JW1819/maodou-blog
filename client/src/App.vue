<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiGet } from './api/http'

const health = ref<string>('…')
const posts = ref<{ title: string }[]>([])

onMounted(async () => {
  try {
    const h = await apiGet<{ ok: boolean }>('/api/health')
    health.value = h.ok ? '后端正常' : '异常'
    const list = await apiGet<{ items: { title: string }[] }>('/api/posts')
    posts.value = list.items
  } catch (e) {
    health.value = `请求失败：${e instanceof Error ? e.message : String(e)}`
  }
})
</script>

<template>
  <div class="page">
    <h1>毛豆博客</h1>
    <p class="status">{{ health }}</p>
    <ul v-if="posts.length">
      <li v-for="(p, i) in posts" :key="i">{{ p.title }}</li>
    </ul>
  </div>
</template>

<style scoped>
.page {
  max-width: 40rem;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}
.status {
  color: #374151;
}
ul {
  margin-top: 1rem;
  padding-left: 1.25rem;
}
</style>
