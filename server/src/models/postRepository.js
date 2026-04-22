import { getDb } from '../db/database.js'

function mapRow(row, { includeContent } = { includeContent: false }) {
  const base = {
    id: String(row.id),
    title: row.title,
    excerpt: row.excerpt,
    category: row.category != null ? String(row.category) : '',
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    viewCount: Number(row.view_count ?? 0),
    status: row.status || 'published',
    createdAt: row.created_at,
  }
  if (includeContent) {
    base.content = row.content
  }
  return base
}

/**
 * @param {{ category?: string | null, tag?: string | null, search?: string | null, status?: string | null, page?: number, limit?: number }} [options]
 */
export function listPosts(options = {}) {
  const { category, tag, search, year, month, status, page = 1, limit = 10 } = options
  const offset = (page - 1) * limit

  let sql = `SELECT id, title, excerpt, category, tags, view_count, status, created_at FROM posts`
  let countSql = `SELECT COUNT(*) as total FROM posts`
  /** @type {unknown[]} */
  const params = []
  const conditions = []

  if (category && category.trim()) {
    conditions.push(`TRIM(IFNULL(category, '')) = ?`)
    params.push(category.trim())
  }

  if (tag && tag.trim()) {
    conditions.push(`tags LIKE ?`)
    params.push(`%${tag.trim()}%`)
  }

  if (search && search.trim()) {
    conditions.push(`(title LIKE ? OR content LIKE ?)`)
    params.push(`%${search.trim()}%`, `%${search.trim()}%`)
  }

  if (year) {
    conditions.push(`strftime('%Y', created_at) = ?`)
    params.push(String(year))
  }

  if (month) {
    const m = String(month).padStart(2, '0')
    conditions.push(`strftime('%m', created_at) = ?`)
    params.push(m)
  }

  if (status) {
    conditions.push(`status = ?`)
    params.push(status)
  }

  if (conditions.length > 0) {
    const where = ` WHERE ` + conditions.join(' AND ')
    sql += where
    countSql += where
  }

  sql += ` ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`
  
  const db = getDb()
  const totalRow = params.length ? db.prepare(countSql).get(...params) : db.prepare(countSql).get()
  const total = Number(totalRow?.total ?? 0)

  const stmt = db.prepare(sql)
  const rows = stmt.all(...params, limit, offset)
  
  return {
    items: rows.map((row) => mapRow(row, { includeContent: false })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export function listDistinctCategories(options = {}) {
  const { status } = options
  let sql = `
    SELECT DISTINCT TRIM(IFNULL(category, '')) AS name
    FROM posts
    WHERE TRIM(IFNULL(category, '')) != ''
  `
  const params = []
  if (status) {
    sql += ` AND status = ?`
    params.push(status)
  }
  sql += ` ORDER BY name COLLATE NOCASE`
  
  const rows = getDb().prepare(sql).all(...params)
  return rows.map((r) => r.name)
}

export function listDistinctTags(options = {}) {
  const { status } = options
  let sql = `SELECT tags FROM posts WHERE tags != ''`
  const params = []
  if (status) {
    sql += ` AND status = ?`
    params.push(status)
  }
  
  const rows = getDb().prepare(sql).all(...params)
  const tagSet = new Set()
  rows.forEach(row => {
    row.tags.split(',').forEach(t => {
      const trimmed = t.trim()
      if (trimmed) tagSet.add(trimmed)
    })
  })
  return Array.from(tagSet).sort()
}

export function getArchives() {
  const rows = getDb()
    .prepare(
      `
      SELECT 
        strftime('%Y', created_at) as year,
        strftime('%m', created_at) as month,
        COUNT(*) as count
      FROM posts
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      `
    )
    .all()
  return rows
}

export function getPostById(id) {
  const row = getDb()
    .prepare(
      `SELECT id, title, excerpt, content, category, tags, view_count, status, created_at FROM posts WHERE id = ?`,
    )
    .get(id)
  if (!row) return null
  return mapRow(row, { includeContent: true })
}

export function incrementViewCount(id) {
  const db = getDb()
  db.prepare(`UPDATE posts SET view_count = view_count + 1 WHERE id = ?`).run(id)
}

export function createPost({ title, excerpt, content, category = '', tags = '', status = 'published' }) {
  const cat = typeof category === 'string' ? category.trim() : ''
  const t = typeof tags === 'string' ? tags.trim() : ''
  const s = status === 'draft' ? 'draft' : 'published'
  const db = getDb()
  db.prepare(
    `INSERT INTO posts (title, excerpt, content, category, tags, status) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(title, excerpt, content, cat, t, s)
  const { id } = db.prepare('SELECT last_insert_rowid() AS id').get()
  return getPostById(Number(id))
}

export function updatePost(id, { title, excerpt, content, category, tags, status }) {
  const db = getDb()
  const current = getPostById(id)
  if (!current) return null

  const t = typeof title === 'string' ? title.trim() : current.title
  const e = typeof excerpt === 'string' ? excerpt.trim() : current.excerpt
  const c = typeof content === 'string' ? content : current.content
  const cat = typeof category === 'string' ? category.trim() : current.category
  const ts = typeof tags === 'string' ? tags.trim() : (Array.isArray(current.tags) ? current.tags.join(',') : '')
  const s = status ? (status === 'draft' ? 'draft' : 'published') : current.status

  db.prepare(
    `UPDATE posts SET title = ?, excerpt = ?, content = ?, category = ?, tags = ?, status = ? WHERE id = ?`,
  ).run(t, e, c, cat, ts, s, id)

  return getPostById(id)
}

export function deletePost(id) {
  const db = getDb()
  const result = db.prepare(`DELETE FROM posts WHERE id = ?`).run(id)
  return result.changes > 0
}
