import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

/** @type {DatabaseSync | null} */
let db = null

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  view_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`

/**
 * 旧库无 category 或 tags 列时补充，已有数据默认为空字符串。
 * @param {DatabaseSync} database
 */
function ensureColumns(database) {
  const cols = database.prepare(`PRAGMA table_info(posts)`).all()
  
  if (!cols.some((c) => c.name === 'category')) {
    database.exec(`ALTER TABLE posts ADD COLUMN category TEXT NOT NULL DEFAULT ''`)
    database.exec(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category)`)
  }
  
  if (!cols.some((c) => c.name === 'tags')) {
    database.exec(`ALTER TABLE posts ADD COLUMN tags TEXT NOT NULL DEFAULT ''`)
    database.exec(`CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts (tags)`)
  }
  
  if (!cols.some((c) => c.name === 'view_count')) {
    database.exec(`ALTER TABLE posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0`)
  }

  if (!cols.some((c) => c.name === 'status')) {
    database.exec(`ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published'`)
    database.exec(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status)`)
  }
}

/**
 * 初始化管理员用户，若不存在。
 */
async function ensureAdminUser(database) {
  const row = database.prepare('SELECT COUNT(*) AS c FROM users').get()
  if (Number(row?.c ?? 0) === 0) {
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.default.hash('Chen@181925', 10)
    database.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('chenjiwei', hashedPassword)
    console.log('Admin user created: chenjiwei / Chen@181925')
  } else {
    // 强制更新已存在的管理员账号，确保符合用户最新要求
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.default.hash('Chen@181925', 10)
    database.prepare('UPDATE users SET username = ?, password = ? WHERE id = 1').run('chenjiwei', hashedPassword)
    console.log('Admin user updated: chenjiwei / Chen@181925')
  }
}

/**
 * 使用 Node 内置 SQLite（node:sqlite）。需 Node ≥ 22.5；启动时可能出现 ExperimentalWarning，属预期。
 * @param {string} databasePath
 */
export async function initDatabase(databasePath) {
  if (db) return

  mkdirSync(dirname(databasePath), { recursive: true })
  db = new DatabaseSync(databasePath)
  db.exec(`PRAGMA journal_mode = WAL;`)
  
  // 【关键修复】：先执行 SCHEMA 创建表
  db.exec(SCHEMA)
  
  // 然后再检查并补全可能缺失的列（针对旧数据迁移）
  ensureColumns(db)
  
  await ensureAdminUser(db)

  const row = db.prepare('SELECT COUNT(*) AS c FROM posts').get()
  const count = Number(row?.c ?? 0)
  if (count === 0) {
    db.prepare(
      `INSERT INTO posts (title, excerpt, content, category, tags) VALUES (?, ?, ?, ?, ?)`,
    ).run(
      '欢迎',
      'SQLite 已就绪，可通过 POST /api/posts 添加文章。',
      '这是启动时自动写入的示例正文。删除或继续写作皆可。',
      '公告',
      '入门,欢迎'
    )
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized; call initDatabase() before handling requests')
  }
  return db
}
