const mockPosts = [
  { id: '1', title: '示例文章', excerpt: '后端已连通，可在此扩展真实数据源。', createdAt: new Date().toISOString() },
]

export function list(_req, res) {
  res.json({ items: mockPosts })
}

export function getById(req, res, next) {
  const post = mockPosts.find((p) => p.id === req.params.id)
  if (!post) {
    const err = new Error('Not Found')
    err.status = 404
    return next(err)
  }
  res.json(post)
}
