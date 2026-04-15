import { reactive } from 'vue'
import { apiGet } from '../api/http'

export const auth = reactive({
  user: null,
  isLoggedIn: false,
  async check() {
    const token = localStorage.getItem('token')
    if (!token) {
      this.user = null
      this.isLoggedIn = false
      return
    }
    try {
      const data = await apiGet('/api/auth/check')
      this.user = data.user
      this.isLoggedIn = true
    } catch (e) {
      this.logout()
    }
  },
  login(token, username) {
    localStorage.setItem('token', token)
    this.user = { username }
    this.isLoggedIn = true
  },
  logout() {
    localStorage.removeItem('token')
    this.user = null
    this.isLoggedIn = false
  }
})
