import { Router } from 'express'

export const aiRouter = Router()

// 文本对话（流式 SSE）
aiRouter.post('/chat', async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'messages is required and must be an array' })
  }

  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    return res.status(500).json({ message: 'MINIMAX_API_KEY not configured' })
  }

  let response
  try {
    response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages,
        stream: true,
      }),
    })
  } catch (err) {
    console.error('MiniMax fetch error:', err.message)
    return res.status(502).json({ message: 'Failed to connect to AI service' })
  }

  if (!response.ok) {
    const error = await response.text()
    console.error('MiniMax API error:', response.status, error)
    return res.status(response.status).json({ message: `AI API error: ${error}` })
  }

  if (!response.body) {
    console.error('MiniMax response body is null')
    return res.status(500).json({ message: 'Response body is null' })
  }

  // 设置 SSE 响应头（必须在任何 res.json() 之前）
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // 手动处理流式响应，避免 pipe 问题
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  async function pump() {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          res.end()
          break
        }
        res.write(decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      console.error('Stream read error:', err)
      res.end()
    }
  }

  pump()
})

// 文生图
aiRouter.post('/image', async (req, res) => {
  const { prompt } = req.body

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ message: 'prompt is required' })
  }

  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    return res.status(500).json({ message: 'MINIMAX_API_KEY not configured' })
  }

  try {
    const response = await fetch('https://api.minimax.chat/v1/image_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'image-01',
        prompt,
        width: 1024,
        height: 1024,
        number: 1,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ message: `MiniMax API error: ${error}` })
    }

    const data = await response.json()
    const imageUrl = data.data?.image_urls?.[0] || data.data?.[0]?.url

    if (!imageUrl) {
      return res.status(500).json({ message: 'No image URL in response' })
    }

    res.json({ url: imageUrl })
  } catch (err) {
    console.error('AI image error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// 图生图
aiRouter.post('/i2i', async (req, res) => {
  const { prompt, image, model } = req.body

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ message: 'prompt is required' })
  }
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ message: 'image (URL or base64 data URL) is required' })
  }

  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    return res.status(500).json({ message: 'MINIMAX_API_KEY not configured' })
  }

  try {
    const response = await fetch('https://api.minimax.chat/v1/image_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'image-01',
        prompt,
        subject_reference: [{
          type: 'character',
          image_file: image,
        }],
        response_format: 'url',
        n: 1,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ message: `MiniMax API error: ${error}` })
    }

    const data = await response.json()
    const imageUrl = data.data?.image_urls?.[0]

    if (!imageUrl) {
      return res.status(500).json({ message: 'No image URL in response' })
    }

    res.json({ url: imageUrl })
  } catch (err) {
    console.error('AI i2i error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})