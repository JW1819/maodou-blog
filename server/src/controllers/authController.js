import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import * as userRepo from '../models/userRepository.js'

export async function login(req, res, next) {
  const { username, password } = req.body || {}
  if (!username || !password) {
    const err = new Error('Username and password are required')
    err.status = 400
    return next(err)
  }

  try {
    const user = userRepo.findUserByUsername(username)
    if (!user) {
      const err = new Error('Invalid credentials')
      err.status = 401
      return next(err)
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      const err = new Error('Invalid credentials')
      err.status = 401
      return next(err)
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      env.jwtSecret,
      { expiresIn: '24h' }
    )

    res.json({ token, username: user.username })
  } catch (e) {
    next(e)
  }
}

export function check(req, res) {
  // If middleware passed, the token is valid
  res.json({ ok: true, user: req.user })
}
