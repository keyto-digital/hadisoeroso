import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { photoOf, tahunHidup } from '../lib/helpers'

/** Tampilan foto resolusi tinggi saat foto diklik. */
export default function Lightbox({ person, onClose }) {
  const [privateFull, setPrivateFull] = useState('')
  const [fullError, setFullError] = useState(false)

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])

  useEffect(() => {
    let active = true
    setPrivateFull('')
    setFullError(false)
    if (person?.full) {
      setPrivateFull(photoOf(person, 'full') || photoOf(person, 'thumb'))
      return () => { active = false }
    }
    if (person?.photo_path && supabase) {
      supabase.storage.from('fotos-full')
        .createSignedUrl(person.photo_path, 300)
        .then(({ data, error }) => {
          if (!active) return
          if (error || !data?.signedUrl) setFullError(true)
          else setPrivateFull(data.signedUrl)
        })
        .catch(() => { if (active) setFullError(true) })
    } else {
      setPrivateFull(photoOf(person, 'thumb'))
    }
    return () => { active = false }
  }, [person])

  const full = privateFull || photoOf(person, 'thumb')
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Tutup">✕</button>
      {full
        ? <img src={full} alt={person.nama} onClick={(e) => e.stopPropagation()} />
        : <div className="empty" style={{ color: '#fff' }}>{fullError ? 'Foto resolusi tinggi belum dipindahkan ke bucket privat.' : 'Foto belum tersedia'}</div>}
      <div className="lb-cap">
        <div className="n">{person.nama}</div>
        <div className="m">{tahunHidup(person)} · 📍 {person.kota || '—'}</div>
        {fullError && <div className="m">Foto resolusi tinggi belum tersedia di bucket privat; yang ditampilkan adalah thumbnail.</div>}
      </div>
    </div>
  )
}