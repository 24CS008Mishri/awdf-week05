import express from 'express'
import { errorHandler, notFound, requestLogger } from '@autoadvisor/middleware'
import routes from './routes/index.js'

const app = express()
app.use(express.json())
app.use(requestLogger(process.env.NODE_ENV || 'development'))
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API is running' }))
app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

export default app
