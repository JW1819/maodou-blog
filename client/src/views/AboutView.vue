<script setup>
import { ref, computed } from 'vue'

const rewardQrError = ref(false)

function onQrError() {
  rewardQrError.value = true
}

const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/JW1819/JW1819.github.io', icon: 'github', link: true },
  { name: '513450092@qq.com', icon: 'email', link: false },
]

const blogSince = new Date('2026-04-19')
const daysRunning = computed(() => {
  const now = new Date()
  return Math.floor((now - blogSince) / (1000 * 60 * 60 * 24))
})
</script>

<template>
  <div class="about">
    <section class="about__hero">
      <p class="about__eyebrow">About</p>
      <h1 class="about__title">关于我</h1>
      <p class="about__desc">
        热爱技术，热爱生活。在这里记录学习与构建的日常，分享技术思考与实践心得。
      </p>
    </section>

    <section class="about__profile">
      <div class="about__avatar-wrap">
        <img src="/image/user.png" alt="头像" class="about__avatar" />
      </div>
      <div class="about__profile-info">
        <h2 class="about__name">Nic</h2>
        <p class="about__role">软件开发</p>
      </div>
    </section>

    <section class="about__section">
      <h2 class="about__section-title">联系方式</h2>
      <div class="social-grid">
        <a
          v-for="item in socialLinks"
          :key="item.name"
          :href="item.link ? item.url : undefined"
          :target="item.link ? '_blank' : undefined"
          :rel="item.link ? 'noopener noreferrer' : undefined"
          :class="['social-card', { 'social-card--text': !item.link }]"
        >
          <span class="social-card__icon">
            <svg v-if="item.icon === 'github'" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </span>
          <span class="social-card__name">{{ item.name }}</span>
        </a>
      </div>
    </section>

    <section class="about__section">
      <h2 class="about__section-title">博客信息</h2>
      <div class="info-grid">
        <div class="info-card">
          <span class="info-card__value">{{ daysRunning }}</span>
          <span class="info-card__label">运行天数</span>
        </div>
        <div class="info-card">
          <span class="info-card__value">开源</span>
          <span class="info-card__label">项目类型</span>
        </div>
      </div>
    </section>

    <section class="about__section about__section--reward">
      <h2 class="about__section-title">请我喝杯咖啡 ☕</h2>
      <p class="about__section-desc">如果我的文章对你有帮助，欢迎打赏支持，你的鼓励是我持续创作的动力！</p>
      <div class="reward-qr">
        <div class="reward-qr__item">
          <img :src="'/image/reward.png'" alt="赞赏码" class="reward-qr__img" @error="onQrError" v-if="!rewardQrError" />
          <div v-else class="reward-qr__placeholder">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="var(--accent)">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z"/>
            </svg>
            <span>赞赏码</span>
            <small>请将图片放到 /public/image/reward.png</small>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about {
  max-width: 680px;
  margin: 0 auto;
}

.about__hero {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.about__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.about__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--text);
}

.about__desc {
  margin: 0;
  max-width: 40rem;
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.about__profile {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.about__avatar-wrap {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--accent), #52b788);
  display: flex;
  align-items: center;
  justify-content: center;
}

.about__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--surface);
}

.about__profile-info {
  flex: 1;
  min-width: 0;
}

.about__name {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.about__role {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--accent);
  font-weight: 500;
}

.about__section {
  padding: 1.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.about__section--reward {
  text-align: center;
}

.about__section-title {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.about__section-desc {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.social-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.social-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.social-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  text-decoration: none;
}

.social-card--text {
  cursor: default;
}

.social-card--text:hover {
  border-color: var(--border);
  transform: none;
}

.social-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.social-card__name {
  font-size: 0.9375rem;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-card {
  text-align: center;
  padding: 1rem 0.5rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.info-card__value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.2;
}

.info-card__label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.reward-qr {
  display: flex;
  justify-content: center;
}

.reward-qr__item {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
}

.reward-qr__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
  padding: 12px;
}

.reward-qr__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--bg);
  border: 2px dashed var(--border);
  border-radius: 50%;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.reward-qr__placeholder small {
  font-size: 0.75rem;
  opacity: 0.6;
}

@media (max-width: 600px) {
  .about__profile {
    flex-direction: column;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
