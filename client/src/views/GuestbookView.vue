<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiGet, apiPost, apiDelete } from '../api/http'
import { formatDate } from '../utils/formatDate'
import { avatarColor, avatarLetter } from '../utils/avatar'
import { auth } from '../stores/auth'

const messages = ref([])
const loading = ref(true)
const pagination = ref({ page: 1, totalPages: 1, total: 0 })
const currentPage = ref(1)

const form = reactive({
  author: '',
  email: '',
  content: '',
  submitting: false,
  error: '',
})

const totalPages = computed(() => pagination.value.totalPages)
const totalCount = computed(() => pagination.value.total)

async function loadMessages() {
  loading.value = true
  try {
    const data = await apiGet(`/api/guestbook?page=${currentPage.value}&limit=10`)
    messages.value = Array.isArray(data?.items) ? data.items : []
    pagination.value = data.pagination || { page: 1, totalPages: 1, total: 0 }
  } catch (e) {
    ElMessage.error('加载留言失败：' + (e instanceof Error ? e.message : String(e)))
    messages.value = []
  } finally {
    loading.value = false
  }
}

async function submitMessage() {
  if (!form.author.trim() || !form.content.trim()) {
    form.error = '昵称和留言内容为必填项'
    return
  }
  form.submitting = true
  form.error = ''
  try {
    const newMsg = await apiPost('/api/guestbook', {
      author: form.author.trim(),
      email: form.email.trim(),
      content: form.content.trim(),
    })
    if (currentPage.value === 1) {
      messages.value.unshift(newMsg)
      if (messages.value.length > 10) messages.value.pop()
    }
    pagination.value.total += 1
    form.author = ''
    form.email = ''
    form.content = ''
    ElMessage.success('留言成功，感谢你的留言！')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    form.error = msg
    ElMessage.error('留言失败：' + msg)
  } finally {
    form.submitting = false
  }
}

async function deleteMessage(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条留言吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await apiDelete(`/api/guestbook/${id}`)
    messages.value = messages.value.filter(m => m.id !== id)
    pagination.value.total -= 1
    ElMessage.success('留言已删除')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadMessages()
}

onMounted(() => {
  auth.check()
  loadMessages()
})
</script>

<template>
  <div class="guestbook">
    <section class="guestbook__hero">
      <p class="guestbook__eyebrow">Guestbook</p>
      <h1 class="guestbook__title">留下你的足迹</h1>
      <p class="guestbook__desc">
        无论是技术探讨、问题反馈，还是随便聊聊，都欢迎在这里留言。
      </p>
    </section>

    <div class="guestbook__layout">
      <section class="guestbook__form-section">
        <form @submit.prevent="submitMessage" class="msg-form">
          <h2 class="msg-form__title">写留言</h2>
          <div class="msg-form__row">
            <div class="field">
              <label class="field__label" for="gb-author">昵称 <span class="field__required">*</span></label>
              <input
                id="gb-author"
                v-model="form.author"
                type="text"
                placeholder="你的昵称"
                required
                maxlength="30"
                class="field__input"
              />
            </div>
            <div class="field">
              <label class="field__label" for="gb-email">邮箱</label>
              <input
                id="gb-email"
                v-model="form.email"
                type="email"
                placeholder="选填，不会公开显示"
                maxlength="100"
                class="field__input"
              />
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="gb-content">留言内容 <span class="field__required">*</span></label>
            <textarea
              id="gb-content"
              v-model="form.content"
              placeholder="说点什么吧..."
              required
              maxlength="500"
              rows="4"
              class="field__textarea"
            ></textarea>
            <span class="field__count">{{ form.content.length }} / 500</span>
          </div>
          <p v-if="form.error" class="msg-form__error" role="alert">{{ form.error }}</p>
          <button type="submit" class="msg-form__submit" :disabled="form.submitting">
            {{ form.submitting ? '提交中...' : '提交留言' }}
          </button>
        </form>
      </section>

      <section class="guestbook__list-section">
        <div class="guestbook__list-head">
          <h2 class="guestbook__list-title">全部留言</h2>
          <span v-if="!loading" class="guestbook__list-count">{{ totalCount }} 条</span>
        </div>

        <div
          v-if="loading"
          class="state state--muted state--loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span class="ui-spinner" aria-hidden="true" />
          <span>正在加载留言…</span>
        </div>

        <div v-else-if="messages.length === 0" class="state state--muted">
          <p class="state__lead">还没有留言</p>
          <p class="state__sub">成为第一个留言的人吧！</p>
        </div>

        <ul v-else class="msg-list" role="list">
          <li v-for="msg in messages" :key="msg.id" class="msg-card">
            <div class="msg-card__avatar" :style="{ backgroundColor: avatarColor(msg.author) }">
              {{ avatarLetter(msg.author) }}
            </div>
            <div class="msg-card__body">
              <div class="msg-card__head">
                <span class="msg-card__author">{{ msg.author }}</span>
                <time class="msg-card__time" :datetime="msg.createdAt">{{ formatDate(msg.createdAt) }}</time>
                <button
                  v-if="auth.isLoggedIn"
                  @click="deleteMessage(msg.id)"
                  class="msg-card__delete"
                  title="删除留言"
                >
                  删除
                </button>
              </div>
              <p class="msg-card__content">{{ msg.content }}</p>
            </div>
          </li>
        </ul>

        <nav v-if="totalPages > 1" class="guestbook__pagination" aria-label="分页导航">
          <el-pagination
            v-model:current-page="currentPage"
            :page-count="totalPages"
            :total="totalCount"
            :page-size="10"
            background
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </nav>
      </section>
    </div>
  </div>
</template>

<style scoped>
.guestbook {
  max-width: 680px;
  margin: 0 auto;
}

.guestbook__hero {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.guestbook__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.guestbook__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
}

.guestbook__desc {
  margin: 0;
  max-width: 40rem;
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.guestbook__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 768px) {
  .guestbook__layout {
    grid-template-columns: 320px 1fr;
  }
}

.msg-form {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  position: sticky;
  top: 8rem;
}

.msg-form__title {
  margin: 0 0 1.25rem;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text);
}

.msg-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 480px) {
  .msg-form__row {
    grid-template-columns: 1fr;
  }
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

.msg-form__error {
  margin: 0 0 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border: 1px solid rgba(180, 35, 24, 0.1);
  border-radius: 8px;
}

.msg-form__submit {
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

.msg-form__submit:hover:not(:disabled) {
  filter: brightness(1.08);
}

.msg-form__submit:active:not(:disabled) {
  transform: scale(0.98);
}

.msg-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.guestbook__list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.guestbook__list-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.guestbook__list-count {
  font-size: 0.8125rem;
  color: var(--text-muted);
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
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.state__sub {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.msg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.guestbook__pagination {
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-active):hover) {
  color: var(--accent);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--accent);
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
