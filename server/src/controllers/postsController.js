import * as postsRepo from '../models/postRepository.js'

export function list(req, res) {
  const { category, tag, search, page, limit } = req.query || {}
  const isAdmin = !!req.user
  
  const result = postsRepo.listPosts({
    category: Array.isArray(category) ? category[0] : category,
    tag: Array.isArray(tag) ? tag[0] : tag,
    search: Array.isArray(search) ? search[0] : search,
    status: isAdmin ? null : 'published', // Public users only see published
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10
  })
  res.json(result)
}

export function archives(req, res) {
  const items = postsRepo.getArchives()
  res.json({ items })
}

export function tags(req, res) {
  const isAdmin = !!req.user
  const items = postsRepo.listDistinctTags({
    status: isAdmin ? null : 'published'
  })
  res.json({ items })
}

export function getById(req, res, next) {
  const id = Number(req.params.id)
  const isAdmin = !!req.user

  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('Invalid id')
    err.status = 400
    return next(err)
  }
  try {
    const post = postsRepo.getPostById(id)
    if (!post || (post.status === 'draft' && !isAdmin)) {
      const err = new Error('Not Found')
      err.status = 404
      return next(err)
    }
    postsRepo.incrementViewCount(id)
    res.json(post)
  } catch (e) {
    next(e)
  }
}

export function create(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      const err = new Error('title is required')
      err.status = 400
      return next(err)
    }
    const excerpt =
      typeof body.excerpt === 'string' ? body.excerpt.trim() : ''
    const content =
      typeof body.content === 'string' ? body.content : ''
    const category =
      typeof body.category === 'string' ? body.category : ''
    const tags =
      typeof body.tags === 'string' ? body.tags : ''
    const status =
      body.status === 'draft' ? 'draft' : 'published'

    const post = postsRepo.createPost({ title, excerpt, content, category, tags, status })
    res.status(201).json(post)
  } catch (e) {
    next(e)
  }
}

export function update(req, res, next) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('Invalid id')
    err.status = 400
    return next(err)
  }

  try {
    const { title, excerpt, content, category, tags, status } = req.body || {}
    const post = postsRepo.updatePost(id, { title, excerpt, content, category, tags, status })
    if (!post) {
      const err = new Error('Not Found')
      err.status = 404
      return next(err)
    }
    res.json(post)
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
    const ok = postsRepo.deletePost(id)
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
