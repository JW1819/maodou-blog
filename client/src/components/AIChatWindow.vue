<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { useAIChat } from '../composables/useAIChat'
import { marked } from 'marked'
import hljs from 'highlight.js'

const emit = defineEmits(['close'])

const { messages, isLoading, sendMessage, stopGeneration, generateImage, generateImageWithRef, clearMessages } = useAIChat()

const mode = ref('chat')
const imageMode = ref('txt2img')
const inputText = ref('')
const messagesContainer = ref(null)
const uploadedImage = ref(null)
const uploadedImageUrl = ref('')

const placeholder = computed(() => {
  if (isLoading.value) return 'AI 正在思考...'
  if (mode.value === 'chat') return '输入消息，Ctrl+Enter 发送...'
  if (imageMode.value === 'img2img') return '描述你想对图片做的改变...'
  return '描述你想生成的图片...'
})

const canSend = computed(() => {
  if (!inputText.value.trim() || isLoading.value) return false
  if (mode.value === 'image' && imageMode.value === 'img2img' && !uploadedImageUrl.value) return false
  return true
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

function handleImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过 10MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (ev) => {
    uploadedImageUrl.value = ev.target.result
    uploadedImage.value = file
  }
  reader.readAsDataURL(file)
}

function removeUploadedImage() {
  uploadedImage.value = null
  uploadedImageUrl.value = ''
}

async function handleSend() {
  if (!canSend.value) return

  const text = inputText.value.trim()
  inputText.value = ''

  if (mode.value === 'chat') {
    await sendMessage(text)
  } else if (imageMode.value === 'txt2img') {
    await generateImage(text)
  } else {
    await generateImageWithRef(text, uploadedImageUrl.value)
    removeUploadedImage()
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleImageClick(url) {
  window.open(url, '_blank')
}

async function copyMessage(content) {
  const text = content.replace(/\[图片\]\([^)]+\)/g, '[图片]')
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

function renderMarkdown(text) {
  if (!text) return ''
  const html = marked.parse(text)
  return html
}

function highlightCode() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block)
      })
    }
  })
}

watch(messages, highlightCode, { deep: true })
</script>

<template>
  <div class="chat-window">
    <header class="chat-window__header">
      <div class="chat-window__title">
        <span class="chat-window__icon">🤖</span>
        <span>AI 助手</span>
      </div>
      <div class="chat-window__actions">
        <button
          class="chat-window__mode-btn"
          :class="{ active: mode === 'chat' }"
          @click="mode = 'chat'"
        >
          对话
        </button>
        <button
          class="chat-window__mode-btn"
          :class="{ active: mode === 'image' }"
          @click="mode = 'image'"
        >
          绘图
        </button>
        <button class="chat-window__clear" @click="clearMessages" title="清空聊天">
          🗑️
        </button>
        <button class="chat-window__close" @click="emit('close')" title="关闭">
          ✕
        </button>
      </div>
    </header>

    <div v-if="mode === 'image'" class="chat-window__image-mode-bar">
      <button
        class="chat-window__sub-mode-btn"
        :class="{ active: imageMode === 'txt2img' }"
        @click="imageMode = 'txt2img'"
      >
        文生图
      </button>
      <button
        class="chat-window__sub-mode-btn"
        :class="{ active: imageMode === 'img2img' }"
        @click="imageMode = 'img2img'"
      >
        图生图
      </button>
    </div>

    <div v-if="mode === 'image' && imageMode === 'img2img'" class="chat-window__upload-area">
      <template v-if="!uploadedImageUrl">
        <label class="chat-window__upload-label">
          <input
            type="file"
            accept="image/*"
            class="chat-window__upload-input"
            @change="handleImageSelect"
            :disabled="isLoading"
          />
          <span class="chat-window__upload-hint">📷 点击上传参考图片</span>
        </label>
      </template>
      <template v-else>
        <div class="chat-window__upload-preview">
          <img :src="uploadedImageUrl" alt="参考图片" class="chat-window__preview-img" />
          <button
            class="chat-window__preview-remove"
            @click="removeUploadedImage"
            title="删除图片"
          >
            ✕
          </button>
        </div>
      </template>
    </div>

    <div class="chat-window__messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="chat-window__empty">
        <p>👋 你好！我是 AI 助手</p>
        <p>可以和我聊天，或者切换到绘图模式生成图片</p>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message"
        :class="`message--${msg.role}`"
      >
        <div class="message__avatar">
          {{ msg.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message__content">
          <template v-if="msg.content.startsWith('[图片](') && msg.content.endsWith(')')">
            <img
              :src="msg.content.slice(5, -1)"
              class="message__image"
              @click="handleImageClick(msg.content.slice(5, -1))"
              alt="AI 生成的图片"
            />
          </template>
          <template v-else-if="msg.content.startsWith('[绘图]') || msg.content.startsWith('[图生图]')">
            <span class="message__text">{{ msg.content }}</span>
          </template>
          <template v-else-if="msg.role === 'user'">
            <span class="message__text">{{ msg.content }}</span>
            <button
              class="message__copy"
              @click="copyMessage(msg.content)"
              title="复制内容"
            >
              📋
            </button>
          </template>
          <template v-else>
            <div class="message__markdown" v-html="renderMarkdown(msg.content)"></div>
            <button
              class="message__copy"
              @click="copyMessage(msg.content)"
              title="复制内容"
            >
              📋
            </button>
            <span v-if="isLoading && msg === messages[messages.length - 1]" class="message__cursor">|</span>
          </template>
        </div>
      </div>

      <div v-if="isLoading" class="message message--assistant">
        <div class="message__avatar">🤖</div>
        <div class="message__content">
          <span class="message__text">正在思考...</span>
        </div>
      </div>
    </div>

    <footer class="chat-window__footer">
      <textarea
        v-model="inputText"
        class="chat-window__input"
        :placeholder="placeholder"
        :disabled="isLoading"
        @keydown="handleKeydown"
        rows="2"
      ></textarea>
      <div class="chat-window__footer-actions">
        <button
          v-if="isLoading && mode === 'chat'"
          class="chat-window__stop"
          @click="stopGeneration"
          title="停止生成"
        >
          ⏹
        </button>
        <button
          class="chat-window__send"
          :disabled="!canSend"
          @click="handleSend"
        >
          {{ isLoading ? '...' : '发送' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.chat-window {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 380px;
  height: 520px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999;
}

.chat-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 95%, transparent);
}

.chat-window__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text);
}

.chat-window__icon {
  font-size: 1.1rem;
}

.chat-window__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-window__mode-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chat-window__mode-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.chat-window__mode-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.chat-window__clear,
.chat-window__close {
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s ease;
}

.chat-window__clear:hover,
.chat-window__close:hover {
  background: var(--accent-soft);
}

.chat-window__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-window__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
  gap: 6px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 85%;
  position: relative;
}

.message:hover .message__copy {
  opacity: 1;
}

.message--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message--assistant {
  align-self: flex-start;
}

.message__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.message--user .message__avatar {
  background: var(--accent);
  color: #fff;
}

.message__content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
}

.message--user .message__content {
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message--assistant .message__content {
  background: var(--bg);
  color: var(--text);
  border-bottom-left-radius: 4px;
}

.message__text {
  white-space: pre-wrap;
}

.message__copy {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.message__copy:hover {
  background: var(--accent-soft);
}

.message__image {
  max-width: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.message__image:hover {
  opacity: 0.85;
}

.message__cursor {
  display: inline-block;
  animation: blink 0.8s infinite;
  color: var(--accent);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Markdown styles */
.message__markdown {
  line-height: 1.6;
}

.message__markdown :deep(h1),
.message__markdown :deep(h2),
.message__markdown :deep(h3),
.message__markdown :deep(h4) {
  margin-top: 0.8em;
  margin-bottom: 0.4em;
  font-weight: 600;
}

.message__markdown :deep(p) {
  margin: 0 0 0.5em;
}

.message__markdown :deep(code) {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 85%;
  background: var(--accent-soft);
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
}

.message__markdown :deep(pre) {
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  margin: 0.5em 0;
}

.message__markdown :deep(pre code) {
  padding: 0;
  background: transparent;
}

.message__markdown :deep(ul),
.message__markdown :deep(ol) {
  margin: 0 0 0.5em;
  padding-left: 1.5em;
}

.message__markdown :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 1em;
  border-left: 3px solid var(--border);
  color: var(--text-muted);
}

.chat-window__footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.chat-window__footer-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-window__input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.15s ease;
}

.chat-window__input:focus {
  border-color: var(--accent);
}

.chat-window__input::placeholder {
  color: var(--text-muted);
}

.chat-window__stop {
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: #dc3545;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chat-window__stop:hover {
  background: #c82333;
}

.chat-window__send {
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  align-self: flex-end;
}

.chat-window__send:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 85%, black);
}

.chat-window__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-window__image-mode-bar {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 95%, transparent);
}

.chat-window__sub-mode-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chat-window__sub-mode-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.chat-window__sub-mode-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.chat-window__upload-area {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.chat-window__upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.chat-window__upload-input {
  display: none;
}

.chat-window__upload-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding: 8px 16px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  width: 100%;
  text-align: center;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.chat-window__upload-hint:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.chat-window__upload-preview {
  position: relative;
  display: inline-block;
}

.chat-window__preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.chat-window__preview-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>