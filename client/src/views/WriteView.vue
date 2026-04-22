<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ElMessage } from 'element-plus'
import { apiPost, apiGet, apiPatch } from '../api/http'
import { categoriesStore } from '../stores/categories'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => route.name === 'edit')
const postId = computed(() => route.params.id)

const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  status: 'published',
})

const errors = reactive({
  title: '',
  excerpt: '',
  content: '',
})

const submitting = ref(false)
const loading = ref(false)

async function loadPost() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const post = await apiGet(`/api/posts/${postId.value}`)
    form.title = post.title
    form.excerpt = post.excerpt
    form.content = post.content
    form.category = post.category
    form.tags = Array.isArray(post.tags) ? post.tags.join(', ') : ''
    form.status = post.status || 'published'
  } catch (e) {
    ElMessage.error('获取文章失败：' + (e instanceof Error ? e.message : String(e)))
  } finally {
    loading.value = false
  }
}

onMounted(loadPost)

function onContentChange(value) {
  form.content = value
  if (value.trim()) errors.content = ''
}

function validate() {
  let valid = true
  errors.title = ''
  errors.excerpt = ''
  errors.content = ''

  if (!form.title.trim()) {
    errors.title = '请输入标题'
    valid = false
  }
  if (!form.excerpt.trim()) {
    errors.excerpt = '请输入摘要'
    valid = false
  }
  if (!form.content.trim()) {
    errors.content = '请输入正文内容'
    valid = false
  }
  return valid
}

async function onUploadImg(files, callback) {
  const results = []
  for (const file of files) {
    const loadingMsg = ElMessage.info({
      message: '正在上传图片...',
      duration: 0
    })
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      const data = await res.json()
      loadingMsg.close()
      if (!res.ok) throw new Error(data.message || 'Upload failed')
      results.push({ url: data.url, alt: file.name })
      ElMessage.success('图片上传成功')
    } catch (e) {
      loadingMsg.close()
      ElMessage.error('图片上传失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }
  callback(results)
}

async function onSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    const data = {
      ...form,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category.trim(),
      tags: form.tags.trim(),
    }

    let post
    if (isEdit.value) {
      post = await apiPatch(`/api/posts/${postId.value}`, data)
    } else {
      post = await apiPost('/api/posts', data)
    }

    categoriesStore.fetch()
    ElMessage.success(isEdit.value ? '文章已更新' : '文章已发布')
    await router.push({ name: 'post', params: { id: post.id } })
  } catch (e) {
    ElMessage.error('保存失败：' + (e instanceof Error ? e.message : String(e)))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="write">
    <section class="write__hero">
      <p class="write__eyebrow">Write</p>
      <h1 class="write__title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
      <p class="write__desc">
        正文支持 Markdown 格式，实时预览，发布即见。
      </p>
    </section>

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

    <form v-else @submit.prevent="onSubmit" class="write-form">
      <div class="write-form__row">
        <div class="field field--flex">
          <label class="field__label" for="write-title">文章标题 <span class="field__required">*</span></label>
          <input
            id="write-title"
            v-model="form.title"
            type="text"
            placeholder="给你的文章起个吸引人的标题..."
            maxlength="100"
            class="field__input"
            @input="errors.title = ''"
          />
          <span v-if="errors.title" class="field__error" role="alert">{{ errors.title }}</span>
        </div>
        <div class="field field--narrow">
          <label class="field__label" for="write-category">分类</label>
          <input
            id="write-category"
            v-model="form.category"
            type="text"
            placeholder="例如：技术、随笔"
            maxlength="30"
            class="field__input"
          />
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="write-tags">标签（用逗号隔开）</label>
        <input
          id="write-tags"
          v-model="form.tags"
          type="text"
          placeholder="例如：Vue, Node.js, 生活"
          class="field__input"
        />
      </div>

      <div class="field">
        <label class="field__label" for="write-excerpt">内容摘要 <span class="field__required">*</span></label>
        <textarea
          id="write-excerpt"
          v-model="form.excerpt"
          placeholder="简要介绍一下文章内容..."
          rows="2"
          maxlength="200"
          class="field__textarea field__textarea--short"
          @input="errors.excerpt = ''"
        ></textarea>
        <span v-if="errors.excerpt" class="field__error" role="alert">{{ errors.excerpt }}</span>
      </div>

      <div class="field">
        <label class="field__label">正文内容 <span class="field__required">*</span></label>
        <div class="editor-container">
          <MdEditor
            :model-value="form.content"
            @update:model-value="onContentChange"
            @onUploadImg="onUploadImg"
            :preview="true"
            placeholder="开始你的创作..."
            :toolbarsExclude="['github', 'htmlPreview', 'catalog']"
            style="height: 500px;"
          />
        </div>
        <span v-if="errors.content" class="field__error" role="alert">{{ errors.content }}</span>
      </div>

      <div class="write-form__footer">
        <div class="status-selector">
          <span class="status-selector__label">发布状态：</span>
          <label class="status-selector__option" :class="{ 'status-selector__option--active': form.status === 'published' }">
            <input type="radio" v-model="form.status" value="published" class="status-selector__radio" />
            立即发布
          </label>
          <label class="status-selector__option" :class="{ 'status-selector__option--active': form.status === 'draft' }">
            <input type="radio" v-model="form.status" value="draft" class="status-selector__radio" />
            保存草稿
          </label>
        </div>

        <div class="write-form__actions">
          <button type="button" class="btn btn--ghost" @click="router.back()">取消</button>
          <button type="submit" class="btn btn--primary" :disabled="submitting">
            {{ submitting ? '提交中...' : (isEdit ? '更新文章' : '发布文章') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.write {
  max-width: 900px;
  margin: 0 auto;
}

.write__hero {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.write__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.write__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
}

.write__desc {
  margin: 0;
  max-width: 40rem;
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.write-form {
  background: var(--surface);
  padding: 2rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.write-form__row {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field--flex {
  flex: 1;
}

.field--narrow {
  align-self: start;
}

.field__label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
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

.field__textarea--short {
  min-height: 3.5rem;
}

.field__error {
  display: block;
  font-size: 0.8125rem;
  color: #b42318;
  margin-top: 0.3rem;
}

.editor-container {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  width: 100%;
}

.write-form__footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.status-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-selector__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}

.status-selector__option {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.status-selector__option:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.status-selector__option--active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.status-selector__radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.write-form__actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.35rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease, background 0.15s ease, border-color 0.15s ease;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.btn--primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.btn--primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--ghost {
  background: var(--surface);
  color: var(--text-muted);
  border-color: var(--border);
}

.btn--ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
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

@media (max-width: 768px) {
  .write {
    max-width: 100%;
    padding: 0 1rem;
  }

  .write-form {
    padding: 1.5rem;
  }

  .write-form__row {
    grid-template-columns: 1fr;
  }

  .write-form__footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .status-selector {
    justify-content: center;
    flex-wrap: wrap;
  }

  .write-form__actions {
    justify-content: center;
  }
}
</style>
