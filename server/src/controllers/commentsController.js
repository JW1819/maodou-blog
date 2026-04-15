import * as commentRepo from '../models/commentRepository.js'

export function list(req, res, next) {
  const postId = Number(req.params.postId)
  if (!Number.isInteger(postId) || postId < 1) {
    const err = new Error('Invalid postId')
    err.status = 400
    return next(err)
  }
  try {
    const items = commentRepo.listCommentsByPostId(postId)
    res.json({ items })
  } catch (e) {
    next(e)
  }
}

export function create(req, res, next) {
  const postId = Number(req.params.postId)
  if (!Number.isInteger(postId) || postId < 1) {
    const err = new Error('Invalid postId')
    err.status = 400
    return next(err)
  }

  try {
    const { author, content } = req.body || {}
    if (!author || !author.trim() || !content || !content.trim()) {
      const err = new Error('author and content are required')
      err.status = 400
      return next(err)
    }

    const comment = commentRepo.createComment({
      postId,
      author: author.trim(),
      content: content.trim(),
    })
    res.status(201).json(comment)
  } catch (e) {
    next(e)
  }
}

export function remove(req, res, next) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('Invalid id')
    err.status = 400
    return next(err)
  }

  try {
    const ok = commentRepo.deleteComment(id)
    if (!ok) {
      const err = new Error('Not Found')
      err.status = 404
      return next(err)
    }
    res.status(204).end()
  } catch (e) {
    next(e)
  }
}
