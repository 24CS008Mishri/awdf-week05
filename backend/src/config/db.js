import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  await mongoose.connect(env.mongoUri)
  console.log(`[db] connected to ${mongoose.connection.name}`)
}

export function disconnectDB() {
  return mongoose.disconnect()
}
