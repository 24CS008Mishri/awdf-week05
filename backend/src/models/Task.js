import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('Task', taskSchema)
