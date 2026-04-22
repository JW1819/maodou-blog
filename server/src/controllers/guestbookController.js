import * as guestbookRepo from '../models/guestbookRepository.js'

export function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const result = guestbookRepo.listGuestbook({ page, limit })
    res.json(result)
  } catch (e) {
    next(e)
  }
}

export function create(req, res, next) {
  try {
    const { author, email, content } = req.body || {}
    if (!author || !author.trim() || !content || !content.trim()) {
      const err = new Error('author and content are required')
      err.status = 400
      return next(err)
    }
    if (content.length > 500) {
      const err = new Error('content must be 500 characters or less')
      err.status = 400
      return next(err)
    }
    const entry = guestbookRepo.createGuestbook({
      author: author.trim(),
      email: (email || '').trim(),
      content: content.trim(),
    })
    res.status(201).json(entry)
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
    const ok = guestbookRepo.deleteGuestbook(id)
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
