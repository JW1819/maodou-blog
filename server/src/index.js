import dotenv from 'dotenv'

dotenv.config()

import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`Server http://localhost:${env.port}`)
})
