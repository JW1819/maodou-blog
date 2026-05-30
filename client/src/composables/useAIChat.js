import { ref } from 'vue'

const STORAGE_KEY = 'maodou-ai-chat'
const MAX_MESSAGES = 50

export function useAIChat() {
  const messages = ref(loadMessages())
  const isLoading = ref(false)

  function loadMessages() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load chat messages:', e)
    }
    return []
  }

  function saveMessages() {
    try {
      const toSave = messages.value.slice(-MAX_MESSAGES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
      console.error('Failed to save chat messages:', e)
    }
  }

  function addMessage(role, content) {
    messages.value.push({ role, content, id: Date.now() })
    saveMessages()
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading.value) return

    const userMessage = { role: 'user', content: text.trim() }
    addMessage('user', text.trim())
    isLoading.value = true

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.value }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiContent = ''

      addMessage('assistant', '')
      const aiMsgIndex = messages.value.length - 1

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                aiContent += delta
                messages.value[aiMsgIndex].content = aiContent
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      saveMessages()
    } catch (err) {
      console.error('Chat error:', err)
      messages.value[aiMsgIndex].content = `抱歉，发生了错误：${err.message}`
      saveMessages()
    } finally {
      isLoading.value = false
    }
  }

  async function generateImage(prompt) {
    if (!prompt.trim() || isLoading.value) return

    addMessage('user', `[绘图] ${prompt.trim()}`)
    isLoading.value = true

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data = await response.json()
      addMessage('assistant', `[图片](${data.url})`)
    } catch (err) {
      console.error('Image error:', err)
      addMessage('assistant', `抱歉，发生了错误：${err.message}`)
    } finally {
      isLoading.value = false
    }
  }

  function clearMessages() {
    messages.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    messages,
    isLoading,
    sendMessage,
    generateImage,
    clearMessages,
  }
}