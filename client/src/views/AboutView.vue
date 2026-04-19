<template>
  <div class="about">
    <el-card shadow="never" class="about-card">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <!-- 优先展示真实头像图片，如果需要可以替换 src -->
          <el-avatar 
            :size="80" 
            src="src/assets/image/user.png" 
            class="profile-avatar-img"
          >
            Nic
          </el-avatar>
        </div>
        <div class="profile-info">
          <h1 class="profile-name">Nic</h1>
          <p class="profile-title">软件开发</p>
        </div>
      </div>
      
      <el-divider />
      
      <div class="profile-content">
        <p class="profile-desc">记录思考、成长与生活日常</p>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.about {
  max-width: 600px;
  margin: 2rem auto;
}

.about-card {
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  transition: transform 0.3s ease;
}

.about-card:hover {
  transform: translateY(-4px);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-wrapper {
  padding: 4px;
  border: 2px solid var(--accent-soft);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar-img {
  background-color: var(--accent);
  font-weight: bold;
  font-size: 1.5rem;
  color: white;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.profile-name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.profile-title {
  margin: 0;
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 500;
}

.profile-content {
  padding: 0.5rem 0;
}

.profile-desc {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--text);
  opacity: 0.9;
}
</style>
