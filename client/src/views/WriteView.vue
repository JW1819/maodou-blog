<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiPost, apiGet, apiPatch } from '../api/http'
import { categoriesStore } from '../stores/categories'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => route.name === 'edit')
const postId = computed(() => route.params.id)

const title = ref('')
const excerpt = ref('')
const content = ref('')
const category = ref('')
const tags = ref('')
const status = ref('published')
const submitting = ref(false)
const loading = ref(false)
const formError = ref('')
const fieldErrors = reactive({
  title: '',
  excerpt: '',
  content: '',
})

async function loadPost() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const post = await apiGet(`/api/posts/${postId.value}`)
    title.value = post.title
    excerpt.value = post.excerpt
    content.value = post.content
    category.value = post.category
    tags.value = Array.isArray(post.tags) ? post.tags.join(', ') : ''
    status.value = post.status || 'published'
  } catch (e) {
    formError.value = '获取文章失败：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

onMounted(loadPost)

function clearFieldErrors() {
  fieldErrors.title = ''
  fieldErrors.excerpt = ''
  fieldErrors.content = ''
}

function validate() {
  clearFieldErrors()
  let ok = true
  if (!title.value.trim()) {
    fieldErrors.title = '标题不能为空'
    ok = false
  }
  if (!excerpt.value.trim()) {
    fieldErrors.excerpt = '摘要不能为空'
    ok = false
  }
  if (!content.value.trim()) {
    fieldErrors.content = '正文不能为空'
    ok = false
  }
  return ok
}

async function onSubmit() {
  formError.value = ''
  if (!validate()) {
    return
  }
  submitting.value = true
  try {
    const data = {
      title: title.value.trim(),
      excerpt: excerpt.value.trim(),
      content: content.value.trim(),
      category: category.value.trim(),
      tags: tags.value.trim(),
      status: status.value,
    }
    let post
    if (isEdit.value) {
      post = await apiPatch(`/api/posts/${postId.value}`, data)
    } else {
      post = await apiPost('/api/posts', data)
    }
    categoriesStore.fetch() // Refresh global categories list
    await router.push({ name: 'post', params: { id: post.id } })
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

async function onImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('image', file)
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Upload failed')
    
    // Insert markdown image tag at current cursor or end of content
    const imgTag = `\n![${file.name}](${data.url})\n`
    content.value += imgTag
  } catch (e) {
    alert('图片上传失败：' + (e instanceof Error ? e.message : String(e)))
  } finally {
    e.target.value = ''
  }
}
</script>

<template>
  <div class="write">
    <h1 class="write__title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
    <p class="write__hint">标题、摘要、正文均需填写；正文支持 Markdown 语法。</p>

    <div v-if="loading" class="state state--muted state--loading">
      <span class="ui-spinner" aria-hidden="true" />
      <span>加载中…</span>
    </div>

    <form v-else class="form" @submit.prevent="onSubmit" novalidate>
      <label class="field">
        <span class="field__label">标题</span>
        <input
          v-model="title"
          class="field__input"
          :class="{ 'field__input--invalid': fieldErrors.title }"
          type="text"
          name="title"
          autocomplete="off"
          aria-required="true"
        />
        <p v-if="fieldErrors.title" class="form__error" role="alert">{{ fieldErrors.title }}</p>
      </label>

      <label class="field">
        <span class="field__label">分类</span>
        <input
          v-model="category"
          class="field__input"
          type="text"
          name="category"
          placeholder="例如：技术、生活"
          autocomplete="off"
        />
      </label>

      <label class="field">
        <span class="field__label">标签</span>
        <input
          v-model="tags"
          class="field__input"
          type="text"
          name="tags"
          placeholder="多个标签用英文逗号隔开，例如：Vue,前端"
          autocomplete="off"
        />
      </label>

      <label class="field">
        <span class="field__label">摘要</span>
        <input
          v-model="excerpt"
          class="field__input"
          :class="{ 'field__input--invalid': fieldErrors.excerpt }"
          type="text"
          name="excerpt"
          autocomplete="off"
          aria-required="true"
        />
        <p v-if="fieldErrors.excerpt" class="form__error" role="alert">{{ fieldErrors.excerpt }}</p>
      </label>

      <div class="field">
        <span class="field__label">状态</span>
        <div class="field__radio-group">
          <label class="field__radio">
            <input type="radio" v-model="status" value="published" />
            发布
          </label>
          <label class="field__radio">
            <input type="radio" v-model="status" value="draft" />
            草稿
          </label>
        </div>
      </div>

      <label class="field">
        <div class="field__label-row">
          <span class="field__label">正文 (Markdown)</span>
          <label class="btn-upload">
            插入图片
            <input type="file" @change="onImageUpload" accept="image/*" hidden />
          </label>
        </div>
        <textarea
          v-model="content"
          class="field__textarea"
          :class="{ 'field__input--invalid': fieldErrors.content }"
          name="content"
          rows="12"
          aria-required="true"
        />
        <p v-if="fieldErrors.content" class="form__error" role="alert">{{ fieldErrors.content }}</p>
      </label>

      <p v-if="formError" class="form__error form__error--request" role="alert">请求失败：{{ formError }}</p>

      <div class="form__actions">
        <button class="btn btn--primary" type="submit" :disabled="submitting">
          {{ submitting ? '提交中…' : (isEdit ? '保存更改' : '发布') }}
        </button>
        <button class="btn btn--secondary" type="button" @click="router.back()">取消</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.write__title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.write__hint {
  margin: 0 0 1.75rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.form {
  max-width: 36rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.field__label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-upload {
  font-size: 0.75rem;
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
}

.field__radio-group {
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.field__radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  cursor: pointer;
}

.field__radio input {
  cursor: pointer;
}

.field__input,
.field__textarea {
  font: inherit;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  width: 100%;
}

.field__textarea {
  resize: vertical;
  min-height: 12rem;
  line-height: 1.55;
}

.field__input:focus,
.field__textarea:focus {
  outline: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
  outline-offset: 1px;
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}

.field__input--invalid,
.field__textarea.field__input--invalid {
  border-color: color-mix(in srgb, #b42318 55%, var(--border));
}

.form__error {
  margin: 0;
  font-size: 0.875rem;
  color: #b42318;
}

.form__actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn--primary {
  background: var(--accent);
  color: white;
}

.btn--secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
