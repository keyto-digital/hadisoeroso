import { initials, photoOf, umur } from '../lib/helpers'

export default function PersonCard({
  person, x, y, isRoot, onClick, highlighted, showBirth = false,
}) {
  const src = photoOf(person, 'thumb')
  const u = showBirth ? umur(person) : null

  return (
    <div className="node" style={{ left: x, top: y, width: 150 }}>
      <div
        className={`card${isRoot ? ' root' : ''}`}
        style={highlighted ? { boxShadow: '0 0 0 3px rgba(227,179,65,.55), 0 8px 24px rgba(11,16,32,.18)' } : undefined}
        onClick={() => onClick?.(person.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault()
            onClick(person.id)
          }
        }}
        title={onClick ? `Lihat detail ${person.nama}` : person.nama}
      >
        {src
          ? <img className="card-photo" src={src} alt={person.nama} loading="lazy" draggable="false" />
          : <div className="card-photo-ph">{initials(person.nama)}</div>}
        <span className={`card-tag ${person.wafat ? 'tag-wafat' : 'tag-hidup'}`}>
          {person.wafat ? 'Wafat' : 'Hidup'}
        </span>
        <div className="card-body">
          <div className="card-name">{person.nama}</div>
          <div className="card-meta">📍 {person.kota || '—'}</div>
          {showBirth && (
            <div className="card-meta">
              {u ? `${u} th` : ''}{person.lahir ? ` · ${person.lahir}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
