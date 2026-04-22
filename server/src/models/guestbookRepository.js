import { getDb } from '../db/database.js'

export function listGuestbook({ page = 1, limit = 10 } = {}) {
  const actualLimit = Math.min(Math.max(1, limit), 50)
  const offset = Math.max(0, (page - 1) * actualLimit)
  const db = getDb()

  const totalRow = db.prepare('SELECT COUNT(*) AS c FROM guestbook').get()
  const total = Number(totalRow?.c ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / actualLimit))

  const rows = db
    .prepare(
      `SELECT id, author, email, content, created_at FROM guestbook ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`,
    )
    .all(actualLimit, offset)

  const items = rows.map((row) => ({
    id: String(row.id),
    author: row.author,
    email: row.email,
    content: row.content,
    createdAt: row.created_at,
  }))

  return { items, pagination: { page, totalPages, total } }
}

export function createGuestbook({ author, email, content }) {
  const db = getDb()
  db.prepare(
    `INSERT INTO guestbook (author, email, content) VALUES (?, ?, ?)`,
  ).run(author, email || '', content)
  const { id } = db.prepare('SELECT last_insert_rowid() AS id').get()
  return {
    id: String(id),
    author,
    email: email || '',
    content,
    createdAt: new Date().toISOString(),
  }
}

export function deleteGuestbook(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM guestbook WHERE id = ?').run(id)
  return result.changes > 0
}
