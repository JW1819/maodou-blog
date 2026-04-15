import { Router } from 'express'
import * as posts from '../controllers/postsController.js'
import { authMiddleware, softAuthMiddleware } from '../middlewares/authMiddleware.js'

export const postsRouter = Router()

postsRouter.get('/', softAuthMiddleware, posts.list)
postsRouter.get('/archives', posts.archives)
postsRouter.get('/tags', softAuthMiddleware, posts.tags)
postsRouter.post('/', authMiddleware, posts.create)
postsRouter.get('/:id', softAuthMiddleware, posts.getById)
postsRouter.patch('/:id', authMiddleware, posts.update)
postsRouter.delete('/:id', authMiddleware, posts.remove)
