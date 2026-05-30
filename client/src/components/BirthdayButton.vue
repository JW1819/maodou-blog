<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isVisible = ref(true)

function goBirthday() {
  router.push('/birthday')
}
</script>

<template>
  <div class="birthday-btn-container">
    <button
      class="birthday-btn"
      @click="goBirthday"
      title="生日快乐"
    >
      🎂
    </button>
    <span class="birthday-tooltip">生日快乐</span>
  </div>
</template>

<style scoped>
.birthday-btn-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.birthday-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid #feca57;
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  cursor: pointer;
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(254, 202, 87, 0.4);
  transition: all 0.3s ease;
}

.birthday-btn:hover {
  transform: scale(1.15) rotate(10deg);
  box-shadow: 0 6px 30px rgba(254, 202, 87, 0.6);
}

.birthday-tooltip {
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(254, 202, 87, 0.4);
  animation: pulse-tooltip 2s ease-in-out infinite;
}

@keyframes pulse-tooltip {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>