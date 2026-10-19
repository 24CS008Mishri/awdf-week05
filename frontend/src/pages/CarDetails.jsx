import { useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import PageHeader from '../components/PageHeader.jsx'
import useAsync from '../hooks/useAsync.js'
import { api } from '../services/api.js'

export default function CarDetails() {
  const { id } = useParams()
  const { data, loading, error, reload } = useAsync(() => api.get(`/cars/${id}`), [id])
  const car = data?.data

  return (
    <main className="shell">
      <PageHeader title="Car Details" />
      {loading && <Loader label="Loading car details…" />}
      {error && <ErrorMessage message={error} onRetry={reload} />}
      {car && (
        <article className="card">
          <h2>{car.company} {car.model}</h2>
          <p className="muted">{car.year} · {car.body} · {car.fuel}</p>
          <p className="pr">₹{car.price} lakh</p>
        </article>
      )}
    </main>
  )
}
