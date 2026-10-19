import app from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'

await connectDB()
const server = app.listen(env.port, () => console.log(`Week 5 API running at http://localhost:${env.port}/api`))

async function shutdown() {
  server.close(async () => { await disconnectDB(); process.exit(0) })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
