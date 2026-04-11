import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { postsRouter } from './routes/posts.js'
import { errorHandler } from './middlewares/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientOrigin }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/posts', postsRouter)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' })
  })

  app.use(errorHandler)

  return app
}
