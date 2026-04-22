<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api/http'
import { auth } from '../stores/auth'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onLogin() {
  loading.value = true
  error.value = ''
  try {
    const data = await apiPost('/api/auth/login', {
      username: username.value,
      password: password.value,
    })
    auth.login(data.token, data.username)
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login__card">
      <div class="login__header">
        <div class="login__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 class="login__title">管理员登录</h1>
        <p class="login__desc">请输入管理员凭据以继续。</p>
      </div>

      <form @submit.prevent="onLogin" class="login__form">
        <div class="field">
          <label class="field__label" for="login-user">用户名</label>
          <input
            id="login-user"
            v-model="username"
            type="text"
            class="field__input"
            placeholder="请输入用户名"
            required
            autocomplete="username"
          />
        </div>
        <div class="field">
          <label class="field__label" for="login-pass">密码</label>
          <input
            id="login-pass"
            v-model="password"
            type="password"
            class="field__input"
            placeholder="请输入密码"
            required
            autocomplete="current-password"
          />
        </div>
        <p v-if="error" class="login__error" role="alert">{{ error }}</p>
        <button type="submit" class="login__submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  padding-top: 3rem;
}

.login__card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 2.5rem 2rem;
}

.login__header {
  text-align: center;
  margin-bottom: 2rem;
}

.login__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  margin-bottom: 1rem;
}

.login__title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.login__desc {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}

.field__input {
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.9375rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field__input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.login__error {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border: 1px solid rgba(180, 35, 24, 0.1);
  border-radius: 8px;
}

.login__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: white;
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
  margin-top: 0.5rem;
}

.login__submit:hover:not(:disabled) {
  filter: brightness(1.08);
}

.login__submit:active:not(:disabled) {
  transform: scale(0.98);
}

.login__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login__card {
    padding: 2rem 1.25rem;
  }
}
</style>
