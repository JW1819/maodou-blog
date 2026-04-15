import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

export const env = {
  port: Number(process.env.PORT) || 3000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databasePath: process.env.DATABASE_PATH || join(serverRoot, 'data', 'blog.db'),
  jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-for-dev',
}
