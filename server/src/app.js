import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import { rateLimit } from 'express-rate-limit'
import { join } from 'path'
import { env } from './config/env.js'
import { postsRouter } from './routes/posts.js'
import * as categories from './controllers/categoriesController.js'
import * as comments from './controllers/commentsController.js'
import * as guestbook from './controllers/guestbookController.js'
import * as authController from './controllers/authController.js'
import { authMiddleware, softAuthMiddleware } from './middlewares/authMiddleware.js'
import { errorHandler } from './middlewares/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(helmet({
    contentSecurityPolicy: false, // 允许前端加载外部资源（如 CDN）
    crossOriginResourcePolicy: false, // 允许跨域请求静态资源
  }))
  app.use(cors({ origin: env.clientOrigin }))
  app.use(express.json())
  
  // 为静态文件配置CORS
  app.use('/uploads', cors({ origin: env.clientOrigin }), express.static(join(env.databasePath, '../../uploads')))

  // Image Upload Configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, join(env.databasePath, '../../uploads'))
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      cb(null, uniqueSuffix + '-' + file.originalname)
    }
  })
  const upload = multer({ storage })

  // Rate Limiters
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
  })

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: { message: 'Too many login attempts, please try again after 15 minutes' }
  })

  const commentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 comments per hour
    message: { message: 'Too many comments from this IP, please try again after an hour' }
  })

  const guestbookLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: 'Too many messages from this IP, please try again after an hour' }
  })

  app.use('/api/', apiLimiter)

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  // Auth routes
  app.post('/api/auth/login', loginLimiter, authController.login)
  app.get('/api/auth/check', authMiddleware, authController.check)

  // Upload route
  app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const url = `/uploads/${req.file.filename}`
    res.json({ url })
  })

  app.get('/api/categories', softAuthMiddleware, categories.list)

  app.use('/api/posts', postsRouter)

  app.get('/api/posts/:postId/comments', comments.list)
  app.post('/api/posts/:postId/comments', commentLimiter, comments.create)
  app.delete('/api/comments/:id', authMiddleware, comments.remove)

  app.get('/api/guestbook', guestbook.list)
  app.post('/api/guestbook', guestbookLimiter, guestbook.create)
  app.delete('/api/guestbook/:id', authMiddleware, guestbook.remove)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' })
  })

  app.use(errorHandler)

  return app
}
