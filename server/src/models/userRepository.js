import { getDb } from '../db/database.js'

export function findUserByUsername(username) {
  return getDb()
    .prepare('SELECT id, username, password FROM users WHERE username = ?')
    .get(username)
}
