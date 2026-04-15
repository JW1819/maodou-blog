import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authentication required')
    err.status = 401
    return next(err)
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.jwtSecret)
    req.user = decoded
    next()
  } catch (e) {
    const err = new Error('Invalid or expired token')
    err.status = 401
    return next(err)
  }
}

export function softAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.jwtSecret)
    req.user = decoded
  } catch (e) {
    // Ignore error, just don't set req.user
  }
  next()
}
