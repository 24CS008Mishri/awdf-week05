import { Route, Routes } from 'react-router-dom'
import CarDetails from './pages/CarDetails.jsx'
import Explore from './pages/Explore.jsx'
import Tasks from './pages/Tasks.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Tasks />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/cars/:id" element={<CarDetails />} />
      <Route path="*" element={<p className="empty">Page not found.</p>} />
    </Routes>
  )
}
