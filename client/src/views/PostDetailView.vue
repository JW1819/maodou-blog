<script setup>
import { computed, onMounted, ref, watch, watchEffect, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import DOMPurify from 'dompurify'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiDelete, apiPost } from '../api/http'
import { formatDate } from '../utils/formatDate'
import { avatarColor, avatarLetter } from '../utils/avatar'
import { auth } from '../stores/auth'
import { categoriesStore } from '../stores/categories'

const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    }
  }),
  { breaks: true, gfm: true }
)

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
  const html = markedInstance.parse(c)
  return DOMPurify.sanitize(html)
})

const readingTime = computed(() => {
  const content = post.value?.content || ''
  const words = content.trim().split(/\s+/).length
  const chars = content.replace(/\s+/g, '').length
  const minutes = Math.ceil((words + chars) / 400)
  return minutes > 0 ? minutes : 1
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
  if (!commentForm.author.trim() || !commentForm.content.trim()) {
    commentForm.error = '昵称和评论内容为必填项'
    return
  }
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
    router.push('/posts')
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
    <nav class="detail__back" aria-label="返回导航">
      <RouterLink class="detail__back-link" to="/posts">
        <span aria-hidden="true">←</span> 返回文章列表
      </RouterLink>
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
    <div v-else-if="error" class="state state--error" role="alert">
      <p class="state__lead">请求失败</p>
      <p class="state__sub">{{ error }}</p>
      <p class="state__sub">请检查链接是否正确，或返回首页重试。</p>
    </div>

    <article v-else-if="post" class="article">
      <header class="article__head">
        <div class="article__meta">
          <time class="article__time" :datetime="post.createdAt">{{ formatDate(post.createdAt) }}</time>
          <span class="article__dot" aria-hidden="true">·</span>
          <span class="article__stat">{{ post.viewCount }} 次阅读</span>
          <span class="article__dot" aria-hidden="true">·</span>
          <span class="article__stat">预计阅读 {{ readingTime }} 分钟</span>
          <RouterLink
            v-if="post.category"
            class="article__cat"
            :to="{ path: '/posts', query: { category: post.category } }"
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
        <div v-else class="state state--muted">
          <p class="state__lead">暂无正文内容</p>
        </div>
      </div>

      <section class="comments">
        <div class="comments__head">
          <h2 class="comments__title">评论</h2>
          <span class="comments__count">{{ comments.length }} 条</span>
        </div>

        <div
          v-if="commentsLoading"
          class="state state--muted state--loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span class="ui-spinner" aria-hidden="true" />
          <span>正在加载评论…</span>
        </div>

        <div v-else-if="comments.length === 0" class="state state--muted">
          <p class="state__lead">暂无评论</p>
          <p class="state__sub">快来抢沙发吧！</p>
        </div>

        <ul v-else class="msg-list" role="list">
          <li v-for="comment in comments" :key="comment.id" class="msg-card">
            <div class="msg-card__avatar" :style="{ backgroundColor: avatarColor(comment.author) }">
              {{ avatarLetter(comment.author) }}
            </div>
            <div class="msg-card__body">
              <div class="msg-card__head">
                <span class="msg-card__author">{{ comment.author }}</span>
                <time class="msg-card__time" :datetime="comment.createdAt">{{ formatDate(comment.createdAt) }}</time>
                <button
                  v-if="auth.isLoggedIn"
                  @click="deleteComment(comment.id)"
                  class="msg-card__delete"
                  title="删除评论"
                >
                  删除
                </button>
              </div>
              <p class="msg-card__content">{{ comment.content }}</p>
            </div>
          </li>
        </ul>

        <form @submit.prevent="submitComment" class="comment-form">
          <h3 class="comment-form__title">发表评论</h3>
          <div class="comment-form__row">
            <div class="field">
              <label class="field__label" for="comment-author">昵称 <span class="field__required">*</span></label>
              <input
                id="comment-author"
                v-model="commentForm.author"
                type="text"
                placeholder="你的昵称"
                required
                maxlength="30"
                class="field__input"
              />
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="comment-content">评论内容 <span class="field__required">*</span></label>
            <textarea
              id="comment-content"
              v-model="commentForm.content"
              placeholder="说点什么吧..."
              required
              maxlength="500"
              rows="4"
              class="field__textarea"
            ></textarea>
            <span class="field__count">{{ commentForm.content.length }} / 500</span>
          </div>
          <p v-if="commentForm.error" class="comment-form__error" role="alert">{{ commentForm.error }}</p>
          <button type="submit" class="comment-form__submit" :disabled="commentForm.submitting">
            {{ commentForm.submitting ? '提交中...' : '提交评论' }}
          </button>
        </form>
      </section>
    </article>
  </div>
</template>

<style scoped>
.detail {
  max-width: 680px;
  margin: 0 auto;
}

.detail__back {
  margin-bottom: 1.5rem;
}

.detail__back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
}

.detail__back-link:hover {
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
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

.article__head {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.article__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.article__time {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.article__dot {
  color: var(--border);
  user-select: none;
}

.article__stat {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.article__cat {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
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

.article__body {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--text);
}

.markdown-body :deep(h1) {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 2rem 0 1rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--border);
}

.markdown-body :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
}

.markdown-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
}

.markdown-body :deep(h4) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
}

.markdown-body :deep(p) {
  margin: 0 0 1rem;
  line-height: 1.8;
}

.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  font-weight: 600;
}

.markdown-body :deep(em) {
  font-style: italic;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 2rem;
}

.markdown-body :deep(li) {
  margin: 0.25rem 0;
  line-height: 1.7;
}

.markdown-body :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  color: var(--text-muted);
  border-radius: 0 8px 8px 0;
}

.markdown-body :deep(blockquote p) {
  margin: 0;
}

.markdown-body :deep(code) {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875em;
}

.markdown-body :deep(pre) {
  background: #1b1b1f;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: transparent;
  color: #e4e4e7;
  padding: 0;
  border-radius: 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
  display: block;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--accent-soft);
  font-weight: 600;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2rem 0;
}

.markdown-body :deep(input[type="checkbox"]) {
  margin-right: 0.5rem;
}

.comments {
  margin-top: 4rem;
  padding-top: 2.5rem;
  border-top: 1px solid var(--border);
}

.comments__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.comments__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.comments__count {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.msg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.msg-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.msg-card:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  transform: translateY(-1px);
}

.msg-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9375rem;
  color: white;
  flex-shrink: 0;
}

.msg-card__body {
  flex: 1;
  min-width: 0;
}

.msg-card__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.msg-card__author {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text);
}

.msg-card__time {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.msg-card__delete {
  margin-left: auto;
  font-size: 0.8125rem;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.msg-card:hover .msg-card__delete {
  opacity: 1;
}

.msg-card__delete:hover {
  color: #b42318;
}

.msg-card__content {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text);
  word-break: break-word;
}

.comment-form {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.comment-form__title {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text);
}

.comment-form__row {
  margin-bottom: 0.75rem;
}

.field {
  margin-bottom: 0.75rem;
}

.field__label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.field__required {
  color: #e76f51;
}

.field__input,
.field__textarea {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.9375rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field__input:focus,
.field__textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field__input::placeholder,
.field__textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.field__textarea {
  min-height: 6rem;
  resize: vertical;
}

.field__count {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.comment-form__error {
  margin: 0 0 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border: 1px solid rgba(180, 35, 24, 0.1);
  border-radius: 8px;
}

.comment-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: white;
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
}

.comment-form__submit:hover:not(:disabled) {
  filter: brightness(1.08);
}

.comment-form__submit:active:not(:disabled) {
  transform: scale(0.98);
}

.comment-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .msg-card {
    padding: 1rem;
  }

  .msg-card__avatar {
    width: 36px;
    height: 36px;
    font-size: 0.875rem;
  }
}
</style>
