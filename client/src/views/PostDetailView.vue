<script setup>
import { computed, onMounted, ref, watch, watchEffect, reactive, nextTick } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // Or any other style
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiDelete, apiPost } from '../api/http'
import { formatDate } from '../utils/formatDate'
import { auth } from '../stores/auth'
import { categoriesStore } from '../stores/categories'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const comments = ref([])
const loading = ref(true)
const commentsLoading = ref(false)
const error = ref('')
const deleting = ref(false)

const commentForm = reactive({
  author: '',
  content: '',
  submitting: false,
  error: '',
})

const renderedContent = computed(() => {
  const c = post.value?.content
  if (!c) return ''
  return c
})

const readingTime = computed(() => {
  const content = post.value?.content || ''
  const words = content.trim().split(/\s+/).length
  const chars = content.replace(/\s+/g, '').length
  // Estimate for a mix of Chinese and English: roughly 300-400 chars/words per minute
  const minutes = Math.ceil((words + chars) / 400)
  return minutes > 0 ? minutes : 1
})

watch(renderedContent, async () => {
  await nextTick()
  hljs.highlightAll()
})

async function load() {
  loading.value = true
  error.value = ''
  post.value = null
  const id = route.params.id
  try {
    post.value = await apiGet(`/api/posts/${encodeURIComponent(id)}`)
    loadComments()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    ElMessage.error('加载文章失败')
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  commentsLoading.value = true
  try {
    const data = await apiGet(`/api/posts/${post.value.id}/comments`)
    comments.value = data.items || []
  } catch (e) {
    console.error('Failed to load comments:', e)
  } finally {
    commentsLoading.value = false
  }
}

async function submitComment() {
  if (!commentForm.author.trim() || !commentForm.content.trim()) return
  commentForm.submitting = true
  commentForm.error = ''
  try {
    const newComment = await apiPost(`/api/posts/${post.value.id}/comments`, {
      author: commentForm.author.trim(),
      content: commentForm.content.trim(),
    })
    comments.value.push(newComment)
    commentForm.author = ''
    commentForm.content = ''
    ElMessage.success('评论发表成功')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    commentForm.error = msg
    ElMessage.error('发表失败：' + msg)
  } finally {
    commentForm.submitting = false
  }
}

async function deleteComment(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await apiDelete(`/api/comments/${id}`)
    comments.value = comments.value.filter(c => c.id !== id)
    ElMessage.success('评论已删除')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }
}

async function onDelete() {
  try {
    await ElMessageBox.confirm('确定要永久删除这篇文章吗？', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'danger',
    })
    
    deleting.value = true
    await apiDelete(`/api/posts/${post.value.id}`)
    categoriesStore.fetch()
    ElMessage.success('文章已删除')
    router.push('/')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + (e instanceof Error ? e.message : String(e)))
    }
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  auth.check()
  load()
})
watch(() => route.params.id, load)

watchEffect(() => {
  const t = post.value?.title
  if (t) document.title = `${t} · 毛豆博客`
})
</script>

<template>
  <div class="detail">
    <p class="detail__back">
      <RouterLink class="detail__back-link" to="/">← 返回首页</RouterLink>
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
    <div v-else-if="error" class="state state--error" role="alert">
      <p class="state__lead">请求失败</p>
      <p class="state__sub">{{ error }}</p>
      <p class="state__sub">请检查链接是否正确，或返回首页重试。</p>
    </div>

    <article v-else-if="post" class="article">
      <header class="article__head">
        <div class="article__meta">
          <time class="article__time" :datetime="post.createdAt">{{ formatDate(post.createdAt) }}</time>
          <span class="article__stat">· {{ post.viewCount }} 次阅读</span>
          <span class="article__stat">· 预计阅读 {{ readingTime }} 分钟</span>
          <RouterLink
            v-if="post.category"
            class="article__cat"
            :to="{ path: '/', query: { category: post.category }, hash: '#posts' }"
          >
            {{ post.category }}
          </RouterLink>
        </div>
        <h1 class="article__title">{{ post.title }}</h1>
        <p v-if="post.excerpt" class="article__excerpt">{{ post.excerpt }}</p>
        <div v-if="auth.isLoggedIn" class="article__actions">
          <RouterLink :to="{ name: 'edit', params: { id: post.id } }" class="btn-link">编辑</RouterLink>
          <button @click="onDelete" class="btn-link btn-link--danger" :disabled="deleting">
            {{ deleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </header>
      <div class="article__body">
        <div v-if="renderedContent" class="markdown-body" v-html="renderedContent"></div>
        <p v-else class="article__empty">暂无正文内容</p>
      </div>

      <section class="comments">
        <h2 class="comments__title">评论 ({{ comments.length }})</h2>
        
        <div v-if="commentsLoading" class="comments__loading">正在加载评论...</div>
        <div v-else-if="comments.length === 0" class="comments__empty">暂无评论，快来抢沙发吧！</div>
        <ul v-else class="comments__list">
          <li v-for="comment in comments" :key="comment.id" class="comment">
            <div class="comment__meta">
              <span class="comment__author">{{ comment.author }}</span>
              <div class="comment__meta-right">
                <time class="comment__time">{{ formatDate(comment.createdAt) }}</time>
                <button v-if="auth.isLoggedIn" @click="deleteComment(comment.id)" class="btn-link btn-link--danger comment__delete">删除</button>
              </div>
            </div>
            <p class="comment__content">{{ comment.content }}</p>
          </li>
        </ul>

        <form @submit.prevent="submitComment" class="comment-form">
          <h3 class="comment-form__title">发表评论</h3>
          <div class="comment-form__row">
            <input v-model="commentForm.author" type="text" placeholder="昵称" required class="comment-form__input" />
          </div>
          <div class="comment-form__row">
            <textarea v-model="commentForm.content" placeholder="评论内容..." required class="comment-form__textarea"></textarea>
          </div>
          <p v-if="commentForm.error" class="comment-form__error">{{ commentForm.error }}</p>
          <button type="submit" class="btn btn--primary" :disabled="commentForm.submitting">
            {{ commentForm.submitting ? '提交中...' : '提交评论' }}
          </button>
        </form>
      </section>
    </article>
  </div>
</template>

<style scoped>
.detail__back {
  margin: 0 0 1.5rem;
}

.detail__back-link {
  font-size: 0.9375rem;
  color: var(--text-muted);
  text-decoration: none;
}

.detail__back-link:hover {
  color: var(--accent);
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

.state--loading span:last-child {
  font-size: 0.9375rem;
}

.article__empty {
  margin: 0;
  padding: 1.5rem 1rem;
  text-align: center;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
  color: var(--text-muted);
  font-size: 0.9375rem;
}

.state--error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border-style: solid;
}

@media (prefers-color-scheme: dark) {
  .state--error {
    color: #fca5a5;
    background: rgba(248, 113, 113, 0.08);
  }
}

.article {
  max-width: 42rem;
}

.article__head {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.article__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
}

.article__time {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.article__stat {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.article__cat {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
}

.article__cat:hover {
  text-decoration: none;
  filter: brightness(1.05);
}

.article__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
}

.article__excerpt {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.article__body {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--text);
}

.article__p {
  margin: 0 0 1rem;
  white-space: pre-wrap;
}

.article__p:last-child {
  margin-bottom: 0;
}

.article__actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}

.btn-link {
  font-size: 0.875rem;
  color: var(--text-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

.btn-link:hover {
  color: var(--accent);
}

.btn-link--danger:hover {
  color: #b42318;
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Comments Styles */
.comments {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.comments__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.comments__list {
  list-style: none;
  padding: 0;
  margin-bottom: 3rem;
}

.comment {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.comment__meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.comment__author {
  font-weight: 600;
  color: var(--text);
}

.comment__time {
  color: var(--text-muted);
}

.comment__content {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.comment-form {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.comment-form__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.comment-form__row {
  margin-bottom: 1rem;
}

.comment-form__input,
.comment-form__textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font: inherit;
}

.comment-form__textarea {
  min-height: 6rem;
  resize: vertical;
}

.btn--primary {
  background: var(--accent);
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn--primary:disabled {
  opacity: 0.6;
}
</style>
