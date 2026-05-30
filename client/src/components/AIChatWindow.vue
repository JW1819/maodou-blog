<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { useAIChat } from '../composables/useAIChat'

const emit = defineEmits(['close'])

const { messages, isLoading, sendMessage, generateImage, clearMessages } = useAIChat()

const mode = ref('chat') // 'chat' | 'image'
const inputText = ref('')
const messagesContainer = ref(null)

const placeholder = computed(() => {
  if (isLoading.value) return 'AI 正在思考...'
  return mode.value === 'chat' ? '输入消息，Ctrl+Enter 发送...' : '描述你想生成的图片...'
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

async function handleSend() {
  if (!inputText.value.trim() || isLoading.value) return

  const text = inputText.value.trim()
  inputText.value = ''

  if (mode.value === 'chat') {
    await sendMessage(text)
  } else {
    await generateImage(text)
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
          <template v-else-if="msg.content.startsWith('[绘图]')">
            <span class="message__text">{{ msg.content }}</span>
          </template>
          <template v-else>
            <span class="message__text">{{ msg.content }}</span>
            <span v-if="isLoading && msg.role === 'assistant' && msg === messages[messages.length - 1]" class="message__cursor">|</span>
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
      <button
        class="chat-window__send"
        :disabled="!inputText.trim() || isLoading"
        @click="handleSend"
      >
        {{ isLoading ? '...' : '发送' }}
      </button>
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

.chat-window__footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
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
</style>