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
    <h1 class="login__title">管理员登录</h1>
    <form @submit.prevent="onLogin" class="form">
      <div class="field">
        <label class="field__label">用户名</label>
        <input v-model="username" type="text" class="field__input" required />
      </div>
      <div class="field">
        <label class="field__label">密码</label>
        <input v-model="password" type="password" class="field__input" required />
      </div>
      <p v-if="error" class="form__error">{{ error }}</p>
      <button type="submit" class="btn btn--primary" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login {
  max-width: 24rem;
  margin: 4rem auto;
}

.login__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 500;
}

.field__input {
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.form__error {
  color: #b42318;
  font-size: 0.875rem;
}

.btn {
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn--primary {
  background: var(--accent);
  color: white;
}

.btn:disabled {
  opacity: 0.6;
}
</style>
