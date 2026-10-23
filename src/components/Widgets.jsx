import { useEffect, useState } from 'react'
import { initials, photoOf, umur } from '../lib/helpers'
import { kegiatanTerurut, formatTanggal, sisaHari } from '../lib/settings'

/* ---------- Widget: Kegiatan Keluarga ---------- */
export function WidgetKegiatan({ kegiatan, onEdit, canEdit, onOpenGallery }) {
  const { akan, lewat } = kegiatanTerurut(kegiatan)
  const tampil = [...akan, ...lewat].slice(0, 5)
  return (
    <section className="widget">
      <div className="widget-head"><span className="wi">📅</span><h4>Kegiatan Keluarga</h4>
        {canEdit && <button className="close-x" style={{ width: 28, height: 28, fontSize: 14 }} title="Ubah kegiatan" onClick={onEdit}>✎</button>}
      </div>
      <div className="widget-body">
        {tampil.length === 0 && <div className="helper">Belum ada kegiatan terjadwal.</div>}
        {tampil.map(k => {
          const s = sisaHari(k.tanggal)
          const isLewat = s !== null && s < 0
          const dekat = s !== null && s >= 0 && s <= 30
          const [y, m, d] = String(k.tanggal || '').split('-')
          return (
            <div className="keg" key={k.id}>
              <div className="keg-date" style={isLewat ? { background: '#eef1f6', color: 'var(--muted)' } : undefined}>
                <div className="d">{d || '—'}</div>
                <div className="m">{formatTanggal(k.tanggal).split(' ')[1] || ''}</div>
              </div>
              <div className="keg-body">
                <div className="keg-judul">{k.judul}</div>
                <div className="keg-meta">📍 {k.tempat || '—'}{y ? ` · ${y}` : ''}</div>
                {k.keterangan && <div className="keg-ket">{k.keterangan}</div>}
                <div className="keg-actions-row">
                  <span className={`keg-pill ${isLewat ? 'lewat' : dekat ? 'soon' : ''}`}>
                    {isLewat ? 'Sudah lewat' : s === 0 ? 'Hari ini!' : dekat ? `${s} hari lagi` : 'Akan datang'}
                  </span>
                  {Array.isArray(k.photos) && k.photos.length > 0 && (
                    <button className="keg-gallery-link" onClick={() => onOpenGallery?.(k)} aria-label={`Lihat galeri ${k.judul}`}>
                      ▧ Galeri Foto <span>{k.photos.length}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Widget: Ringkasan Keluarga ---------- */
export function WidgetRingkasan({ people, units, rootId, layoutDepth }) {
  const hidup = people.filter(p => !p.wafat).length
  const wafat = people.length - hidup
  const pasangan = units.filter(u => u.partnerIds.length >= 2).length
  const generasi = (layoutDepth || 0) + 1
  return (
    <section className="widget">
      <div className="widget-head"><span className="wi">🌿</span><h4>Ringkasan Keluarga</h4></div>
      <div className="widget-body">
        <div className="stat-grid">
          <div className="stat"><div className="v">{people.length}</div><div className="l">Anggota</div></div>
          <div className="stat"><div className="v">{generasi}</div><div className="l">Generasi</div></div>
          <div className="stat"><div className="v" style={{ color: 'var(--ok)' }}>{hidup}</div><div className="l">Masih hidup</div></div>
          <div className="stat"><div className="v" style={{ color: 'var(--muted)' }}>{wafat}</div><div className="l">Telah wafat</div></div>
        </div>
        <div className="bar-row" style={{ marginTop: 12 }}>
          <span className="bar-lab">Pasangan</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: people.length ? `${Math.round(pasangan * 2 / people.length * 100)}%` : '0%' }} /></span>
          <span className="bar-num">{pasangan}</span>
        </div>
      </div>
    </section>
  )
}

/* ---------- Widget: Sebaran Kota ---------- */
export function WidgetKota({ people }) {
  const hitung = {}
  people.forEach(p => { if (p.kota) hitung[p.kota] = (hitung[p.kota] || 0) + 1 })
  const list = Object.entries(hitung).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const max = list[0]?.[1] || 1
  return (
    <section className="widget">
      <div className="widget-head"><span className="wi">📍</span><h4>Sebaran Kota</h4></div>
      <div className="widget-body">
        {list.length === 0 && <div className="helper">Belum ada data kota.</div>}
        {list.map(([kota, n]) => (
          <div className="bar-row" key={kota}>
            <span className="bar-lab" title={kota}>{kota}</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${Math.round(n / max * 100)}%` }} /></span>
            <span className="bar-num">{n}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Widget: Ulang Tahun Terdekat ---------- */
export function WidgetUltah({ people }) {
  const dgnTgl = people.filter(p => p.lahir)
  const tertua = [...dgnTgl].sort((a, b) => a.lahir - b.lahir).slice(0, 3)
  return (
    <section className="widget">
      <div className="widget-head"><span className="wi">🕯️</span><h4>Anggota Tertua</h4></div>
      <div className="widget-body">
        {tertua.map(p => {
          const src = photoOf(p, 'thumb')
          const u = umur(p)
          return (
            <div className="bday" key={p.id}>
              {src ? <img className="av" src={src} alt="" /> : <span className="av" style={{ display: 'grid', placeItems: 'center', background: 'var(--brand-600)', color: '#fff', fontWeight: 800, fontSize: 12 }}>{initials(p.nama)}</span>}
              <div style={{ minWidth: 0 }}>
                <div className="nm">{p.nama}</div>
                <div className="dt">Lahir {p.lahir}{u ? ` · ${u} th` : ''}{p.wafat ? ' (almarhum/ah)' : ''}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Panel pembungkus ---------- */
export default function Widgets({ open, onClose, people, units, rootId, layoutDepth, kegiatan, onEditKegiatan, onOpenGallery, canEdit }) {
  return (
    <>
      {open && <div className="widgets-scrim" onClick={onClose} />}
      <aside className={`widgets${open ? ' open' : ''}`}>
        <WidgetRingkasan people={people} units={units} rootId={rootId} layoutDepth={layoutDepth} />
        <WidgetKegiatan kegiatan={kegiatan} onEdit={onEditKegiatan} canEdit={canEdit} onOpenGallery={onOpenGallery} />
        <WidgetKota people={people} />
        <WidgetUltah people={people} />
      </aside>
    </>
  )
}

/* ---------- Galeri Kenangan Keluarga ---------- */
export function GaleriKegiatan({ kegiatan, onClose, getPhotoUrl }) {
  const photos = Array.isArray(kegiatan?.photos) ? kegiatan.photos : []
  const [items, setItems] = useState([])
  const [active, setActive] = useState(-1)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setItems([]); setError('')
    Promise.all(photos.map(async (photo) => {
      try {
        const [thumb, full] = await Promise.all([
          getPhotoUrl(photo.thumbPath),
          getPhotoUrl(photo.fullPath),
        ])
        return { ...photo, thumbUrl: thumb, fullUrl: full }
      } catch (e) {
        return { ...photo, loadError: e.message }
      }
    })).then(result => { if (alive) setItems(result) })
      .catch(e => { if (alive) setError(e.message || 'Galeri gagal dimuat.') })
    return () => { alive = false }
  }, [kegiatan?.id, photos.length, getPhotoUrl])

  useEffect(() => {
    if (active < 0) return
    const keydown = (e) => {
      if (e.key === 'Escape') setActive(-1)
      if (e.key === 'ArrowRight') setActive(i => Math.min(items.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setActive(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [active, items.length])

  return (
    <div className="memory-backdrop" onClick={onClose} role="presentation">
      <section className="memory-modal" role="dialog" aria-modal="true" aria-label={`Galeri ${kegiatan?.judul || 'Kenangan Keluarga'}`} onClick={e => e.stopPropagation()}>
        <header className="memory-head">
          <div className="memory-title-icon">❦</div>
          <div className="memory-heading">
            <div className="memory-eyebrow">KENANGAN KELUARGA</div>
            <h2>{kegiatan?.judul || 'Galeri Kegiatan'}</h2>
            <p>{kegiatan?.tanggal || ''}{kegiatan?.tempat ? ` · ${kegiatan.tempat}` : ''} · {photos.length} foto</p>
          </div>
          <button className="memory-close" onClick={onClose} aria-label="Tutup galeri">✕</button>
        </header>
        <div className="memory-content">
          {error && <div className="msg msg-err">{error}</div>}
          {!items.length && !error && <div className="memory-loading"><span className="spinner" /> Menyiapkan kenangan…</div>}
          {!!items.length && <div className="memory-grid">
            {items.map((photo, i) => (
              <button className="memory-tile" key={photo.id || photo.fullPath || i} onClick={() => setActive(i)} title="Lihat foto penuh">
                {photo.thumbUrl ? <img src={photo.thumbUrl} alt={`Kenangan ${i + 1}`} loading="lazy" /> : <span className="memory-photo-error">Foto tidak tersedia</span>}
                <span className="memory-tile-mark">↗</span>
              </button>
            ))}
          </div>}
        </div>
      </section>
      {active >= 0 && items[active] && (
        <div className="memory-lightbox" onClick={() => setActive(-1)} role="presentation">
          <button className="memory-lightbox-close" onClick={() => setActive(-1)} aria-label="Tutup foto">✕</button>
          {items.length > 1 && <button className="memory-nav prev" onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + items.length) % items.length) }} aria-label="Foto sebelumnya">‹</button>}
          {items[active].fullUrl ? <img src={items[active].fullUrl} alt={`Kenangan ${active + 1}`} onClick={e => e.stopPropagation()} /> : <p>Foto penuh tidak dapat dibuka.</p>}
          {items.length > 1 && <button className="memory-nav next" onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % items.length) }} aria-label="Foto berikutnya">›</button>}
          <div className="memory-counter">{active + 1} / {items.length}</div>
        </div>
      )}
    </div>
  )
}
