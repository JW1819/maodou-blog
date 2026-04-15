import * as postsRepo from '../models/postRepository.js'

export function list(req, res) {
  const isAdmin = !!req.user
  const items = postsRepo.listDistinctCategories({
    status: isAdmin ? null : 'published'
  })
  res.json({ items })
}
