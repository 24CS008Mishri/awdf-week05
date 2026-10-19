import Task from '../models/Task.js'

export async function listTasks(_req, res, next) {
  try {
    const data = await Task.find().sort({ createdAt: -1 })
    res.json({ success: true, count: data.length, data })
  } catch (error) { next(error) }
}

export async function createTask(req, res, next) {
  try {
    const task = await Task.create(req.body)
    res.status(201).json({ success: true, data: task })
  } catch (error) { next(error) }
}

export async function updateTask(req, res, next) {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
    return res.json({ success: true, data: task })
  } catch (error) { return next(error) }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id)
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })
    return res.json({ success: true, message: 'Task deleted' })
  } catch (error) { return next(error) }
}
