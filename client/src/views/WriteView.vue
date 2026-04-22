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

const formRef = ref(null)
const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  status: 'published',
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  excerpt: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }],
}

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
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

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
  })
}
</script>

<template>
  <div class="write">
    <div class="write-header">
      <h1 class="write__title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
      <p class="write__hint">正文支持 Markdown 格式，实时预览，发布即见。</p>
    </div>

    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="h1" style="width: 50%; margin-bottom: 20px" />
        <el-skeleton-item variant="text" style="margin-bottom: 10px" />
        <el-skeleton-item variant="text" style="margin-bottom: 10px" />
        <el-skeleton-item variant="rect" style="height: 300px" />
      </template>

      <template #default>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="write-form"
        >
          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="文章标题" prop="title">
                <el-input v-model="form.title" placeholder="给你的文章起个吸引人的标题..." size="large" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="分类" prop="category">
                <el-input v-model="form.category" placeholder="例如：技术、随笔" size="large" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="标签 (用逗号隔开)" prop="tags">
            <el-input v-model="form.tags" placeholder="例如：Vue, Node.js, 生活" />
          </el-form-item>

          <el-form-item label="内容摘要" prop="excerpt">
            <el-input
              v-model="form.excerpt"
              type="textarea"
              :rows="2"
              placeholder="简要介绍一下文章内容..."
            />
          </el-form-item>

          <el-form-item prop="content">
            <template #label>
              <div class="content-label">
                <span>正文内容 (Markdown 编辑器)</span>
              </div>
            </template>
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
          </el-form-item>

          <div class="form-footer">
            <div class="status-selector">
              <span class="status-label">发布状态：</span>
              <el-radio-group v-model="form.status">
                <el-radio-button label="published">立即发布</el-radio-button>
                <el-radio-button label="draft">保存草稿</el-radio-button>
              </el-radio-group>
            </div>

            <div class="actions">
              <el-button @click="router.back()">取消</el-button>
              <el-button type="primary" :loading="submitting" @click="onSubmit" size="large">
                {{ isEdit ? '更新文章' : '发布文章' }}
              </el-button>
            </div>
          </div>
        </el-form>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.write {
  max-width: 900px;
  margin: 0 auto;
}

.write-header {
  margin-bottom: 2rem;
}

.write__title {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
}

.write__hint {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.write-form {
  background: var(--surface);
  padding: 2rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.content-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.editor-container {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  width: 100%;
}

.form-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.status-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .write {
    max-width: 100%;
    padding: 0 1rem;
  }

  .write-form {
    padding: 1.5rem;
  }

  .form-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .status-selector {
    justify-content: center;
  }

  .actions {
    justify-content: center;
  }
}
</style>
