<script setup>
import { ref, nextTick, watch, computed, onMounted } from 'vue'
import { useAIChat } from '../composables/useAIChat'
import { marked } from 'marked'
import hljs from 'highlight.js'

const { messages, isLoading, sendMessage, stopGeneration, generateImage, generateImageWithRef, textToSpeech, clearMessages } = useAIChat()

const mode = ref('chat')
const imageMode = ref('txt2img')
const inputText = ref('')
const messagesContainer = ref(null)
const uploadedImage = ref(null)
const uploadedImageUrl = ref('')
const selectedVoice = ref('male-qn-qingse')
const playingAudioId = ref(null)
let audioElement = null

const musicStep = ref('input')
const musicTheme = ref('')
const generatedLyrics = ref('')
const musicAudioUrl = ref('')
const musicLoading = ref(false)

const voiceOptions = [
  { id: 'male-qn-qingse', name: '青年男声', model: 'Speech-2.6-Turbo' },
  { id: 'female-qn-jingying', name: '青年女声', model: 'Speech-2.6-Turbo' },
  { id: 'male-qn-bsafe', name: '成熟男声', model: 'Speech-02-HD' },
  { id: 'female-qn-tianmei', name: '甜美女声', model: 'Speech-02-HD' },
]

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

onMounted(() => {
  scrollToBottom()
})

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

async function playAudio(msgId, content) {
  if (playingAudioId.value === msgId) {
    audioElement?.pause()
    playingAudioId.value = null
    return
  }

  const voice = voiceOptions.find(v => v.id === selectedVoice.value) || voiceOptions[0]
  const blob = await textToSpeech(content, voice.model, selectedVoice.value)
  if (!blob) return

  if (audioElement) {
    audioElement.pause()
  }

  audioElement = new Audio(URL.createObjectURL(blob))
  playingAudioId.value = msgId
  audioElement.onended = () => {
    playingAudioId.value = null
  }
  audioElement.play()
}

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
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

async function generateLyrics() {
  if (!musicTheme.value.trim()) return

  musicLoading.value = true
  musicStep.value = 'lyrics'

  try {
    const response = await fetch('/api/ai/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: musicTheme.value }),
    })

    if (!response.ok) {
      throw new Error('生成歌词失败')
    }

    const data = await response.json()
    generatedLyrics.value = data.lyrics || ''
    musicStep.value = 'lyrics'
  } catch (err) {
    alert(err.message)
    musicStep.value = 'input'
  } finally {
    musicLoading.value = false
  }
}

async function generateMusic() {
  if (!generatedLyrics.value.trim()) return

  musicLoading.value = true
  musicStep.value = 'generating'

  try {
    const response = await fetch('/api/ai/music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics: generatedLyrics.value }),
    })

    if (!response.ok) {
      throw new Error('生成音乐失败')
    }

    const blob = await response.blob()
    musicAudioUrl.value = URL.createObjectURL(blob)
    musicStep.value = 'done'
  } catch (err) {
    alert(err.message)
    musicStep.value = 'lyrics'
  } finally {
    musicLoading.value = false
  }
}

function resetMusic() {
  musicStep.value = 'input'
  musicTheme.value = ''
  generatedLyrics.value = ''
  musicAudioUrl.value = ''
}

function playMusic() {
  if (audioElement) {
    audioElement.pause()
  }
  audioElement = new Audio(musicAudioUrl.value)
  audioElement.play()
}

function downloadMusic() {
  const a = document.createElement('a')
  a.href = musicAudioUrl.value
  a.download = 'ai-music.mp3'
  a.click()
}
</script>

<template>
  <div class="ai-page">
    <div class="ai-page__header">
      <div class="ai-page__header-top">
        <h1 class="ai-page__title">🤖 AI 助手</h1>
        <button v-if="messages.length > 0" class="ai-page__clear" @click="clearMessages" title="清空历史">
          🗑️ 清空记录
        </button>
      </div>
      <p class="ai-page__desc">可以和我对话聊天，或者生成图片</p>
      <div class="ai-page__voice-bar">
        <select v-model="selectedVoice" class="ai-page__voice-select">
          <option v-for="voice in voiceOptions" :key="voice.id" :value="voice.id">
            {{ voice.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="ai-page__content">
      <div class="ai-page__sidebar">
        <div class="ai-mode-card" :class="{ active: mode === 'chat' }" @click="mode = 'chat'">
          <span class="ai-mode-card__icon">💬</span>
          <span class="ai-mode-card__name">AI 对话</span>
          <span class="ai-mode-card__desc">智能问答、写作辅助</span>
        </div>
        <div class="ai-mode-card" :class="{ active: mode === 'image' }" @click="mode = 'image'">
          <span class="ai-mode-card__icon">🎨</span>
          <span class="ai-mode-card__name">AI 绘图</span>
          <span class="ai-mode-card__desc">文生图、图生图</span>
        </div>
        <div class="ai-mode-card" :class="{ active: mode === 'music' }" @click="mode = 'music'">
          <span class="ai-mode-card__icon">🎵</span>
          <span class="ai-mode-card__name">音乐创作</span>
          <span class="ai-mode-card__desc">一键写歌、歌词创作</span>
        </div>
      </div>

      <div class="ai-page__main">
        <template v-if="mode === 'chat'">
          <div class="ai-chat">
            <div class="ai-chat__messages" ref="messagesContainer">
              <div v-if="messages.length === 0" class="ai-chat__empty">
                <div class="ai-chat__empty-icon">🤖</div>
                <p>你好！我是 AI 助手</p>
                <p>可以问我任何问题，或者帮我写作、编程、翻译等</p>
              </div>

              <div
                v-for="msg in messages"
                :key="msg.id"
                class="ai-message"
                :class="`ai-message--${msg.role}`"
              >
                <div class="ai-message__avatar">
                  <img v-if="msg.role === 'assistant'" src="/image/AI.jpg" alt="AI" class="ai-message__avatar-img" />
                  <span v-else>👤</span>
                </div>
                <div class="ai-message__body">
                  <div class="ai-message__content">
                    <template v-if="msg.content.startsWith('[图片](') && msg.content.endsWith(')')">
                      <img
                        :src="msg.content.slice(5, -1)"
                        class="ai-message__image"
                        @click="handleImageClick(msg.content.slice(5, -1))"
                        alt="AI 生成的图片"
                      />
                    </template>
                    <template v-else-if="msg.content.startsWith('[绘图]') || msg.content.startsWith('[图生图]')">
                      <span class="ai-message__text">{{ msg.content }}</span>
                    </template>
                    <template v-else-if="msg.role === 'user'">
                      <span class="ai-message__text">{{ msg.content }}</span>
                      <button class="ai-message__copy" @click="copyMessage(msg.content)" title="复制">📋</button>
                    </template>
                    <template v-else>
                      <div class="ai-message__markdown" v-html="renderMarkdown(msg.content)"></div>
                      <div class="ai-message__actions">
                        <button class="ai-message__copy" @click="copyMessage(msg.content)" title="复制">📋</button>
                        <button
                          v-if="!msg.content.startsWith('[图片]')"
                          class="ai-message__play"
                          :class="{ playing: playingAudioId === msg.id }"
                          @click="playAudio(msg.id, msg.content)"
                          title="播放语音"
                        >
                          {{ playingAudioId === msg.id ? '⏸' : '🔊' }}
                        </button>
                      </div>
                      <span v-if="isLoading && msg === messages[messages.length - 1]" class="ai-message__cursor">|</span>
                    </template>
                  </div>
                </div>
              </div>

              <div v-if="isLoading" class="ai-message ai-message--assistant">
                <div class="ai-message__avatar">
                  <img src="/image/AI.jpg" alt="AI" class="ai-message__avatar-img" />
                </div>
                <div class="ai-message__body">
                  <div class="ai-message__content">
                    <span class="ai-message__text">正在思考...</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="ai-chat__input-area">
              <textarea
                v-model="inputText"
                class="ai-chat__input"
                :placeholder="placeholder"
                :disabled="isLoading"
                @keydown="handleKeydown"
                rows="3"
              ></textarea>
              <div class="ai-chat__actions">
                <button v-if="isLoading" class="ai-chat__stop" @click="stopGeneration">⏹ 停止</button>
                <button class="ai-chat__send" :disabled="!canSend" @click="handleSend">
                  {{ isLoading ? '生成中...' : '发送' }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="mode === 'image'">
          <div class="ai-draw">
            <div class="ai-draw__mode-bar">
              <button
                class="ai-draw__mode-btn"
                :class="{ active: imageMode === 'txt2img' }"
                @click="imageMode = 'txt2img'"
              >
                📝 文生图
              </button>
              <button
                class="ai-draw__mode-btn"
                :class="{ active: imageMode === 'img2img' }"
                @click="imageMode = 'img2img'"
              >
                🖼️ 图生图
              </button>
            </div>

            <div v-if="imageMode === 'img2img'" class="ai-draw__upload">
              <template v-if="!uploadedImageUrl">
                <label class="ai-draw__upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    class="ai-draw__upload-input"
                    @change="handleImageSelect"
                    :disabled="isLoading"
                  />
                  <div class="ai-draw__upload-hint">
                    <span>📷</span>
                    <span>点击上传参考图片</span>
                    <span class="ai-draw__upload-tip">支持 JPG、PNG，小于 10MB</span>
                  </div>
                </label>
              </template>
              <template v-else>
                <div class="ai-draw__preview">
                  <img :src="uploadedImageUrl" alt="参考图片" class="ai-draw__preview-img" />
                  <button class="ai-draw__preview-remove" @click="removeUploadedImage">✕ 删除</button>
                </div>
              </template>
            </div>

            <div class="ai-draw__input-area">
              <textarea
                v-model="inputText"
                class="ai-draw__input"
                :placeholder="placeholder"
                :disabled="isLoading"
                @keydown="handleKeydown"
                rows="4"
              ></textarea>
              <button class="ai-draw__send" :disabled="!canSend" @click="handleSend">
                {{ isLoading ? '生成中...' : '生成图片' }}
              </button>
            </div>

            <div v-if="messages.filter(m => m.content.startsWith('[图片](') || m.content.startsWith('[绘图]') || m.content.startsWith('[图生图]')).length > 0" class="ai-draw__history">
              <h3 class="ai-draw__history-title">生成记录</h3>
              <div class="ai-draw__history-grid">
                <div
                  v-for="msg in messages.filter(m => m.content.startsWith('[图片]('))"
                  :key="msg.id"
                  class="ai-draw__history-item"
                  @click="handleImageClick(msg.content.slice(5, -1))"
                >
                  <img :src="msg.content.slice(5, -1)" :alt="msg.content" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="mode === 'music'">
          <div class="ai-music">
            <div v-if="musicStep === 'input'" class="ai-music__step">
              <h2 class="ai-music__step-title">🎵 一键写歌</h2>
              <p class="ai-music__step-desc">输入你的创作主题，AI 将为你生成歌词并谱曲演唱</p>
              <div class="ai-music__input-group">
                <input
                  v-model="musicTheme"
                  type="text"
                  class="ai-music__input"
                  placeholder="例如：生日祝福、表白、思念、励志..."
                  @keydown.enter="generateLyrics"
                />
                <button
                  class="ai-music__btn ai-music__btn--primary"
                  :disabled="!musicTheme.trim() || musicLoading"
                  @click="generateLyrics"
                >
                  {{ musicLoading ? '生成中...' : '开始创作 ✨' }}
                </button>
              </div>
              <div class="ai-music__tips">
                <p>💡 创作示例：</p>
                <ul>
                  <li>写一首关于青春成长的民谣</li>
                  <li>为妈妈写一首感恩的歌曲</li>
                  <li>浪漫的情歌，主题是异地恋</li>
                </ul>
              </div>
            </div>

            <div v-else-if="musicStep === 'lyrics'" class="ai-music__step">
              <h2 class="ai-music__step-title">📝 歌词已生成</h2>
              <p class="ai-music__step-desc">确认歌词后，直接生成音乐</p>
              <div class="ai-music__lyrics-box">
                <textarea
                  v-model="generatedLyrics"
                  class="ai-music__lyrics-editor"
                  placeholder="编辑歌词..."
                  rows="12"
                ></textarea>
              </div>
              <div class="ai-music__actions">
                <button class="ai-music__btn" @click="resetMusic">← 重新开始</button>
                <button
                  class="ai-music__btn ai-music__btn--primary"
                  :disabled="musicLoading"
                  @click="generateMusic"
                >
                  {{ musicLoading ? '生成中...' : '🎶 生成音乐 →' }}
                </button>
              </div>
            </div>

            <div v-else-if="musicStep === 'generating'" class="ai-music__step">
              <h2 class="ai-music__step-title">🎶 正在生成音乐...</h2>
              <p class="ai-music__step-desc">AI 正在为你的歌词谱曲，请稍候</p>
              <div class="ai-music__loading">
                <div class="ai-music__spinner"></div>
                <p>这可能需要几秒钟...</p>
              </div>
            </div>

            <div v-else-if="musicStep === 'done'" class="ai-music__step">
              <h2 class="ai-music__step-title">🎉 音乐已生成！</h2>
              <div class="ai-music__result">
                <div class="ai-music__lyrics-box">
                  <h3>📝 歌词</h3>
                  <pre class="ai-music__lyrics-preview">{{ generatedLyrics }}</pre>
                </div>
                <div class="ai-music__player">
                  <h3>🎵 完整歌曲</h3>
                  <audio :src="musicAudioUrl" controls class="ai-music__audio"></audio>
                  <div class="ai-music__player-actions">
                    <button class="ai-music__btn" @click="playMusic">▶ 播放</button>
                    <button class="ai-music__btn" @click="downloadMusic">⬇ 下载</button>
                  </div>
                </div>
              </div>
              <div class="ai-music__actions">
                <button class="ai-music__btn" @click="resetMusic">← 再创作一首</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-page {
  max-width: var(--max);
  margin: 0 auto;
}

.ai-page__header {
  text-align: center;
  padding: 2rem 0;
}

.ai-page__header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.ai-page__title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem;
}

.ai-page__desc {
  color: var(--text-muted);
  margin: 0;
}

.ai-page__clear {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ai-page__clear:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.ai-page__voice-bar {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.ai-page__voice-select {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
}

.ai-page__voice-select:focus {
  outline: none;
  border-color: var(--accent);
}

.ai-page__content {
  display: flex;
  gap: 1.5rem;
  min-height: 600px;
}

.ai-page__sidebar {
  width: 200px;
  flex-shrink: 0;
}

.ai-mode-card {
  padding: 1rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 0.75rem;
}

.ai-mode-card:hover {
  border-color: var(--accent);
}

.ai-mode-card.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.ai-mode-card__icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.ai-mode-card__name {
  font-weight: 600;
  display: block;
}

.ai-mode-card__desc {
  font-size: 0.8rem;
  opacity: 0.8;
  display: block;
  margin-top: 0.25rem;
}

.ai-page__main {
  flex: 1;
  min-width: 0;
}

.ai-chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.ai-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-chat__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-align: center;
}

.ai-chat__empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.ai-chat__empty p {
  margin: 0.25rem 0;
}

.ai-chat__input-area {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.ai-chat__input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.9375rem;
  font-family: inherit;
  resize: none;
  outline: none;
}

.ai-chat__input:focus {
  border-color: var(--accent);
}

.ai-chat__input::placeholder {
  color: var(--text-muted);
}

.ai-chat__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.ai-chat__stop {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: #dc3545;
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
}

.ai-chat__send {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
}

.ai-chat__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-message {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
}

.ai-message--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  overflow: hidden;
}

.ai-message__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-message--user .ai-message__avatar {
  background: var(--accent);
  color: #fff;
}

.ai-message__body {
  flex: 1;
  min-width: 0;
}

.ai-message__content {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.9375rem;
  line-height: 1.6;
  position: relative;
}

.ai-message--user .ai-message__content {
  background: var(--accent);
  color: #fff;
}

.ai-message__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-message__copy {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.ai-message:hover .ai-message__copy {
  opacity: 1;
}

.ai-message__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.ai-message__play {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.ai-message:hover .ai-message__play {
  opacity: 1;
}

.ai-message__play:hover {
  background: var(--accent-soft);
}

.ai-message__play.playing {
  opacity: 1;
  color: var(--accent);
}

.ai-message--user .ai-message__copy {
  color: rgba(255,255,255,0.8);
}

.ai-message--user .ai-message__copy:hover {
  color: #fff;
}

.ai-message__image {
  max-width: 100%;
  border-radius: 8px;
  cursor: pointer;
}

.ai-message__cursor {
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ai-message__markdown {
  line-height: 1.6;
}

.ai-message__markdown :deep(h1),
.ai-message__markdown :deep(h2),
.ai-message__markdown :deep(h3) {
  margin-top: 0.8em;
  margin-bottom: 0.4em;
  font-weight: 600;
}

.ai-message__markdown :deep(p) {
  margin: 0 0 0.5em;
}

.ai-message__markdown :deep(code) {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 85%;
  background: var(--accent-soft);
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.ai-message__markdown :deep(pre) {
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  margin: 0.5em 0;
}

.ai-message__markdown :deep(pre code) {
  padding: 0;
  background: transparent;
}

.ai-message__markdown :deep(ul),
.ai-message__markdown :deep(ol) {
  margin: 0 0 0.5em;
  padding-left: 1.5em;
}

.ai-message__markdown :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 1em;
  border-left: 3px solid var(--border);
  color: var(--text-muted);
}

.ai-draw {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.ai-draw__mode-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.ai-draw__mode-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ai-draw__mode-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.ai-draw__mode-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.ai-draw__upload {
  margin-bottom: 1rem;
}

.ai-draw__upload-label {
  display: block;
  cursor: pointer;
}

.ai-draw__upload-input {
  display: none;
}

.ai-draw__upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  border: 2px dashed var(--border);
  border-radius: 12px;
  color: var(--text-muted);
  transition: border-color 0.15s ease;
}

.ai-draw__upload-hint:hover {
  border-color: var(--accent);
}

.ai-draw__upload-hint span:first-child {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.ai-draw__upload-tip {
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.ai-draw__preview {
  display: inline-block;
  position: relative;
}

.ai-draw__preview-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.ai-draw__preview-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 0.75rem;
}

.ai-draw__input-area {
  margin-top: 1rem;
}

.ai-draw__input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.ai-draw__input:focus {
  border-color: var(--accent);
}

.ai-draw__input::placeholder {
  color: var(--text-muted);
}

.ai-draw__send {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.ai-draw__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-draw__history {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.ai-draw__history-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.ai-draw__history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.ai-draw__history-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border);
}

.ai-draw__history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-music {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  min-height: 600px;
}

.ai-music__step {
  max-width: 700px;
  margin: 0 auto;
}

.ai-music__step-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  text-align: center;
}

.ai-music__step-desc {
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 2rem;
}

.ai-music__input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.ai-music__input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  font-size: 1rem;
  outline: none;
}

.ai-music__input:focus {
  border-color: var(--accent);
}

.ai-music__input::placeholder {
  color: var(--text-muted);
}

.ai-music__btn {
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.ai-music__btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.ai-music__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-music__btn--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.ai-music__btn--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 85%, black);
  color: #fff;
}

.ai-music__tips {
  background: var(--bg);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.ai-music__tips p {
  margin: 0 0 0.5rem;
}

.ai-music__tips ul {
  margin: 0;
  padding-left: 1.25rem;
}

.ai-music__tips li {
  margin: 0.25rem 0;
}

.ai-music__lyrics-box {
  margin-bottom: 1.5rem;
}

.ai-music__lyrics-editor {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.9375rem;
  font-family: inherit;
  line-height: 1.8;
  resize: vertical;
  outline: none;
}

.ai-music__lyrics-editor:focus {
  border-color: var(--accent);
}

.ai-music__actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ai-music__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.ai-music__spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-music__result h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.ai-music__lyrics-preview {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  margin: 0 0 1.5rem;
}

.ai-music__player {
  background: var(--bg);
  border-radius: 10px;
  padding: 1.25rem;
}

.ai-music__audio {
  width: 100%;
  margin-bottom: 1rem;
}

.ai-music__player-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .ai-page__content {
    flex-direction: column;
  }

  .ai-page__sidebar {
    width: 100%;
    display: flex;
    gap: 0.5rem;
  }

  .ai-mode-card {
    flex: 1;
    margin-bottom: 0;
    text-align: center;
    padding: 0.75rem;
  }

  .ai-mode-card__desc {
    display: none;
  }

  .ai-chat {
    height: calc(100vh - 300px);
    min-height: 400px;
  }

  .ai-message {
    max-width: 95%;
  }

  .ai-music__input-group {
    flex-direction: column;
  }

  .ai-music__actions {
    flex-direction: column;
  }

  .ai-music__btn {
    width: 100%;
  }
}
</style>