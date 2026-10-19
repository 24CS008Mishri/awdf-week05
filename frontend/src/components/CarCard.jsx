export default function CarCard({ car }) {
  return (
    <article className="card">
      <h2>{car.company} {car.model}</h2>
      <p className="muted">{car.year} · {car.body} · {car.fuel}</p>
      <p className="pr">₹{car.price} lakh</p>
    </article>
  )
}
