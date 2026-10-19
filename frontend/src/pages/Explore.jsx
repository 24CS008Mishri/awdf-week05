import { useState } from 'react'
import CarCard from '../components/CarCard.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import PageHeader from '../components/PageHeader.jsx'
import useAsync from '../hooks/useAsync.js'
import { api } from '../services/api.js'

export default function Explore() {
  const [query, setQuery] = useState('')
  const { data, loading, error, reload } = useAsync(() => api.get('/cars', { search: query }), [query])
  const cars = data?.data || []

  return (
    <main className="shell">
      <PageHeader title="Explore Cars" noBack search={query} setSearch={setQuery} placeholder="Search cars" />
      {loading && <Loader label="Loading cars…" />}
      {error && <ErrorMessage message={error} onRetry={reload} />}
      {!loading && !error && cars.length === 0 && <p className="empty">No cars found.</p>}
      <section className="grid">
        {cars.map((car) => <CarCard key={car.id} car={car} />)}
      </section>
    </main>
  )
}
