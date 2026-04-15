<template>
  <div class="about">
    <h1 class="about__title">关于</h1>
    <p class="about__p">
      毛豆博客是全栈练习项目：前端为 Vue 3 + Vite，后端为 Express，数据存放在 SQLite（Node 内置
      <code class="code">node:sqlite</code>）。你可以从导航进入首页浏览文章、查看详情，或使用「写文章」发布新内容。
    </p>
    <p class="about__p">
      接口前缀为 <code class="code">/api</code>：列表 <code class="code">GET /api/posts</code>、详情
      <code class="code">GET /api/posts/:id</code>、发布 <code class="code">POST /api/posts</code>。
    </p>
  </div>
</template>

<style scoped>
.about__title {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.about__p {
  margin: 0 0 1rem;
  max-width: 40rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text-muted);
}

.about__p:last-child {
  margin-bottom: 0;
}

.code {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 0.88em;
  padding: 0.12em 0.35em;
  border-radius: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}
</style>
