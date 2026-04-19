import { reactive } from 'vue'

export const toast = reactive({
  message: '',
  type: 'info', // 'info', 'success', 'error'
  visible: false,
  timer: null,

  show(message, type = 'info', duration = 3000) {
    this.message = message
    this.type = type
    this.visible = true

    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.visible = false
    }, duration)
  },

  success(msg) { this.show(msg, 'success') },
  error(msg) { this.show(msg, 'error') },
  info(msg) { this.show(msg, 'info') }
})
