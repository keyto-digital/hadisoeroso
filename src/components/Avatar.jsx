import { initials, photoOf } from '../lib/helpers'

/** Foto kecil orang; otomatis pakai inisial bila tidak ada foto. */
export default function Avatar({ person, size = 26, radius = '50%', className = '' }) {
  const src = photoOf(person, 'thumb')
  const style = { width: size, height: size, borderRadius: radius, flex: 'none' }
  if (src) {
    return <img src={src} alt={person?.nama || ''} style={style} className={className} loading="lazy" />
  }
  const fs = Math.max(10, Math.round(size * 0.42))
  return (
    <span
      className={`av ${className}`}
      style={{
        ...style, display: 'inline-grid', placeItems: 'center',
        background: 'linear-gradient(145deg,#4b5a8a,#2b3a6b)', color: '#fff',
        fontWeight: 800, fontSize: fs, letterSpacing: '.3px',
      }}
    >
      {initials(person?.nama)}
    </span>
  )
}