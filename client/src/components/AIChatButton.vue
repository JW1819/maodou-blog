<script setup>
import { ref } from 'vue'
import AIChatWindow from './AIChatWindow.vue'

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="ai-chat">
    <AIChatWindow v-if="isOpen" @close="isOpen = false" />
    <div class="ai-chat__tooltip">{{ isOpen ? '关闭 AI 助手' : '向 AI 提问' }}</div>
    <button
      class="ai-chat__btn"
      :class="{ 'ai-chat__btn--open': isOpen }"
      @click="toggle"
    >
      <img v-if="!isOpen" src="/image/AI.jpeg" alt="AI" class="ai-chat__icon" />
      <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ai-chat {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-chat__tooltip {
  position: absolute;
  right: 70px;
  background: var(--surface);
  color: var(--text);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  opacity: 0;
  transform: translateX(10px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ai-chat:hover .ai-chat__tooltip {
  opacity: 1;
  transform: translateX(0);
}

.ai-chat__btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-chat__btn:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(45, 106, 79, 0.35);
}

.ai-chat__btn:active {
  transform: scale(0.96);
}

.ai-chat__btn--open {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}

.ai-chat__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
</style>