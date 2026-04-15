import dotenv from 'dotenv'

dotenv.config()

import { initDatabase } from './db/database.js'
import { createApp } from './app.js'
import { env } from './config/env.js'

initDatabase(env.databasePath)

const app = createApp()

app.listen(env.port, () => {
  console.log(`Server http://localhost:${env.port}`)
  console.log(`SQLite: ${env.databasePath}`)
})
