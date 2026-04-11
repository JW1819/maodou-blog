import { Router } from 'express'
import * as posts from '../controllers/postsController.js'

export const postsRouter = Router()

postsRouter.get('/', posts.list)
postsRouter.get('/:id', posts.getById)
