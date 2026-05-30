<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const lyrics = ref([])
const currentLineIndex = ref(-1)
const isPlaying = ref(false)
const audioRef = ref(null)
const containerRef = ref(null)
const showContent = ref(false)

function parseLyrics(text) {
  const lines = text.split('\n')
  const result = []
  let currentTime = 0
  const avgCharTime = 0.5

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue
    if (trimmed.startsWith('---')) continue
    if (trimmed.startsWith('**')) continue
    if (trimmed.startsWith('*（')) continue
    if (trimmed.includes('副歌记忆点')) continue
    if (trimmed.startsWith('🎵') && trimmed.length < 10) continue

    let textContent = trimmed
      .replace(/^🎤\s*/, '')
      .replace(/^🎵\s*/, '')
      .replace(/^[\[【「『（]/, '')
      .replace(/[\]】」』）。]$/, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/（[^）]*）/g, '')
      .trim()

    if (textContent.length < 2) continue
    if (textContent.match(/^[～\-\.\:\;\。\：\；]+$/)) continue

    result.push({ time: currentTime, text: textContent })
    currentTime += Math.max(2, textContent.length * avgCharTime + 1)
  }
  return result
}

onMounted(async () => {
  try {
    const res = await fetch('/birthday/word.txt')
    const text = await res.text()
    lyrics.value = parseLyrics(text)
    console.log('歌词解析结果:', lyrics.value)
  } catch (e) {
    console.error('加载歌词失败:', e)
  }

  setTimeout(() => {
    showContent.value = true
    setTimeout(() => {
      if (audioRef.value) {
        audioRef.value.play().catch(() => {})
        isPlaying.value = true
      }
    }, 500)
  }, 300)
})

function onTimeUpdate() {
  if (!audioRef.value || lyrics.value.length === 0) return
  const currentTime = audioRef.value.currentTime

  let newIndex = -1
  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics.value[i].time) {
      newIndex = i
      break
    }
  }

  if (newIndex !== currentLineIndex.value) {
    currentLineIndex.value = newIndex
    if (containerRef.value && newIndex >= 0) {
      const items = containerRef.value.querySelectorAll('.lyric-line')
      if (items[newIndex]) {
        const containerHeight = containerRef.value.clientHeight
        const itemTop = items[newIndex].offsetTop
        const itemHeight = items[newIndex].clientHeight
        const targetScroll = itemTop - (containerHeight / 2) + (itemHeight / 2)
        containerRef.value.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }
    }
  }
}

function togglePlay() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(() => {})
  }
  isPlaying.value = !isPlaying.value
}

const confettiElements = ref([])
let confettiId = 0

function createConfetti() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3', '#54a0ff']
  for (let i = 0; i < 50; i++) {
    const id = confettiId++
    confettiElements.value.push({
      id,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    })
    setTimeout(() => {
      confettiElements.value = confettiElements.value.filter(c => c.id !== id)
    }, 6000)
  }
}

let confettiInterval

onMounted(() => {
  confettiInterval = setInterval(createConfetti, 3000)
})

onUnmounted(() => {
  if (confettiInterval) clearInterval(confettiInterval)
})
</script>

<template>
  <div class="birthday-page">
    <div class="birthday-bg">
      <div class="bg-balloon balloon-1"></div>
      <div class="bg-balloon balloon-2"></div>
      <div class="bg-balloon balloon-3"></div>
      <div class="bg-star star-1"></div>
      <div class="bg-star star-2"></div>
      <div class="bg-star star-3"></div>
    </div>

    <div class="confetti-container">
      <div
        v-for="c in confettiElements"
        :key="c.id"
        class="confetti"
        :style="{
          left: c.left + '%',
          backgroundColor: c.color,
          animationDelay: c.delay + 's',
          animationDuration: c.duration + 's'
        }"
      ></div>
    </div>

    <div class="birthday-content" :class="{ 'birthday-content--visible': showContent }">
      <h1 class="birthday-title">
        <span class="title-char" style="animation-delay: 0s">生</span>
        <span class="title-char" style="animation-delay: 0.1s">日</span>
        <span class="title-char" style="animation-delay: 0.2s">快</span>
        <span class="title-char" style="animation-delay: 0.3s">乐</span>
      </h1>

      <p class="birthday-subtitle">🎂 石利荣 🎂</p>

      <div class="audio-control">
        <button @click="togglePlay" class="btn-play">
          <span v-if="isPlaying">⏸️</span>
          <span v-else>▶️</span>
        </button>
        <audio ref="audioRef" @timeupdate="onTimeUpdate" src="/birthday/music.mp3"></audio>
      </div>

      <div ref="containerRef" class="lyrics-container">
        <div
          v-for="(line, index) in lyrics"
          :key="index"
          class="lyric-line"
          :class="{ 'lyric-active': index === currentLineIndex }"
        >
          {{ line.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.birthday-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
}

.birthday-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-balloon {
  position: absolute;
  width: 60px;
  height: 75px;
  border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.balloon-1 {
  background: #ff6b6b;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.balloon-2 {
  background: #feca57;
  top: 20%;
  right: 15%;
  animation-delay: 1s;
}

.balloon-3 {
  background: #48dbfb;
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

.bg-star {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 {
  top: 15%;
  left: 30%;
  animation-delay: 0s;
}

.star-2 {
  top: 25%;
  right: 25%;
  animation-delay: 0.5s;
}

.star-3 {
  bottom: 30%;
  left: 15%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}

.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.birthday-content {
  position: relative;
  z-index: 10;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  text-align: center;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease;
  height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
}

.birthday-content--visible {
  opacity: 1;
  transform: translateY(0);
}

.birthday-title {
  font-size: 3.5rem;
  flex-shrink: 0;
  font-weight: 800;
  background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #1dd1a1, #ff9ff3);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease infinite;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
  gap: 0.2rem;
}

.title-char {
  display: inline-block;
  animation: bounce-in 0.6s ease-out backwards;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-10deg);
  }
  50% {
    transform: scale(1.1) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.birthday-subtitle {
  font-size: 1.3rem;
  color: #feca57;
  margin: 0.5rem 0 1.5rem;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.audio-control {
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.btn-play {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-play:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.lyrics-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 2rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(254, 202, 87, 0.5) transparent;
}

.lyrics-container::-webkit-scrollbar {
  width: 4px;
}

.lyrics-container::-webkit-scrollbar-track {
  background: transparent;
}

.lyrics-container::-webkit-scrollbar-thumb {
  background: rgba(254, 202, 87, 0.5);
  border-radius: 2px;
}

.lyric-line {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.4);
  padding: 0.6rem 1rem;
  line-height: 1.8;
  transition: all 0.4s ease;
  border-radius: 8px;
  margin: 0.2rem 0;
}

.lyric-active {
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 0 30px rgba(254, 202, 87, 1), 0 0 60px rgba(254, 202, 87, 0.6);
  background: rgba(254, 202, 87, 0.15);
  transform: scale(1.05);
  border-left: 3px solid #feca57;
  padding-left: 1.5rem;
}
</style>