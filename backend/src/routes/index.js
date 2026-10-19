import { Router } from 'express'
import * as tasks from '../controllers/task.controller.js'

const router = Router()
router.get('/tasks', tasks.listTasks)
router.post('/tasks', tasks.createTask)
router.put('/tasks/:id', tasks.updateTask)
router.delete('/tasks/:id', tasks.deleteTask)

export default router
