import { reactive } from 'vue'
import { apiGet } from '../api/http'

export const categoriesStore = reactive({
  items: [],
  loading: false,
  async fetch() {
    this.loading = true
    try {
      const data = await apiGet('/api/categories')
      this.items = Array.isArray(data?.items) ? data.items : []
    } catch {
      this.items = []
    } finally {
      this.loading = false
    }
  }
})
