import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
}

if (!env.mongoUri) throw new Error('MONGODB_URI is required')
