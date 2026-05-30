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
    <button
      class="ai-chat__btn"
      :class="{ 'ai-chat__btn--open': isOpen }"
      @click="toggle"
      :title="isOpen ? '关闭 AI 助手' : '打开 AI 助手'"
    >
      <svg v-if="!isOpen" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17v-2H9l4-4 1.5 1.5L14 11l-3 3v-4h2v6h-4z" fill="currentColor"/>
      </svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
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
</style>