import { getDb } from '../db/database.js'

export function listCommentsByPostId(postId) {
  const rows = getDb()
    .prepare(
      `SELECT id, author, content, created_at FROM comments WHERE post_id = ? ORDER BY datetime(created_at) ASC`,
    )
    .all(postId)
  return rows.map((row) => ({
    id: String(row.id),
    author: row.author,
    content: row.content,
    createdAt: row.created_at,
  }))
}

export function createComment({ postId, author, content }) {
  const db = getDb()
  db.prepare(
    `INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)`,
  ).run(postId, author, content)
  const { id } = db.prepare('SELECT last_insert_rowid() AS id').get()
  return {
    id: String(id),
    postId: String(postId),
    author,
    content,
    createdAt: new Date().toISOString(),
  }
}

export function deleteComment(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM comments WHERE id = ?').run(id)
  return result.changes > 0
}
