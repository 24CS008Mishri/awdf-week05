import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

const emptyForm = { title: '', description: '', priority: 'medium' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTasks = async () => {
    setLoading(true); setError('')
    try { setTasks((await api.get('/tasks')).data || []) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadTasks() }, [])

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  async function createTask(event) {
    event.preventDefault()
    try {
      await api.post('/tasks', form)
      setForm(emptyForm)
      await loadTasks()
    } catch (err) { setError(err.message) }
  }

  async function updateStatus(id, status) {
    try { await api.put(`/tasks/${id}`, { status }); await loadTasks() } catch (err) { setError(err.message) }
  }

  async function deleteTask(id) {
    try { await api.del(`/tasks/${id}`); await loadTasks() } catch (err) { setError(err.message) }
  }

  return (
    <main className="shell">
      <h1>Task Manager</h1>
      <form className="card" onSubmit={createTask}>
        <h2>Create Task</h2>
        <label>Title<input value={form.title} onChange={update('title')} required /></label>
        <label>Description<textarea value={form.description} onChange={update('description')} /></label>
        <label>Priority<select value={form.priority} onChange={update('priority')}><option>low</option><option>medium</option><option>high</option></select></label>
        <button className="pill dark" type="submit">Add Task</button>
      </form>
      {loading && <p className="muted">Loading tasks…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <section className="grid">
        {tasks.map((task) => (
          <article className="card" key={task.id}>
            <h2>{task.title}</h2>
            <p className="muted">{task.description || 'No description'}</p>
            <label>Status<select value={task.status} onChange={(event) => updateStatus(task.id, event.target.value)}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
            <button className="pill" onClick={() => deleteTask(task.id)}>Delete</button>
          </article>
        ))}
      </section>
    </main>
  )
}
