import { DEMO_PEOPLE, DEMO_UNITS, DEMO_ROOT } from './demoData'
import { supabase, DEMO } from './supabase'
import { fotoDemo } from './demoPhotoData'

/* ---------- util data ---------- */

export const initials = (nama = '') => {
  const parts = String(nama).trim().split(/\s+/).filter(p => !/^(H\.?|Hj\.?|Ir\.?|S\.Pd\.?|Dr\.?|Drs\.?)$/i.test(p))
  const use = parts.length ? parts : String(nama).trim().split(/\s+/)
  const a = (use[0] || '?')[0] || '?'
  const b = use.length > 1 ? use[use.length - 1][0] || '' : ''
  return (a + b).toUpperCase()
}

/** '/demo/p12_thumb.webp' -> data URL WebP tertanam (agar versi 1-file tetap tampil foto). */
const pakaiDemo = (u) => {
  if (!u) return ''
  if (u.startsWith('/demo/')) return fotoDemo(u.slice(6)) || ''
  return u
}

/** Ambil URL foto: 'thumb' (kartu) atau 'full' (lightbox). */
export const photoOf = (person, kind = 'thumb') => {
  if (!person) return ''
  const direct = kind === 'thumb' ? person.thumb : person.full
  if (direct) {
    const d = pakaiDemo(direct)
    // bila versi 'full' tidak tersedia (mis. foto demo yang di-inline hanya versi kecil),
    // pakai versi 'thumb' sebagai cadangan agar foto tetap muncul saat diklik.
    if (d) return d
    if (kind === 'full') return pakaiDemo(person.thumb)
    return ''
  }
  // Thumbnail public untuk kartu. Foto resolusi tinggi ada di bucket privat
  // 'fotos-full' dan URL sementara dibuat oleh Lightbox setelah login.
  const path = kind === 'thumb' ? person.photo_thumb_path : person.photo_path
  if (path && supabase && kind === 'thumb') {
    return supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl
  }
  return ''
}

export const umur = (p) => {
  if (!p?.lahir) return null
  const end = p.wafat && p.wafatTahun ? p.wafatTahun : new Date().getFullYear()
  return end - p.lahir
}

export const tahunHidup = (p) => {
  if (!p?.lahir) return ''
  if (p.wafat) return `${p.lahir} – ${p.wafatTahun || '?'}`
  return `${p.lahir} – sekarang`
}

/* ---------- penyimpanan DEMO (localStorage) ---------- */

const LS_PEOPLE = 'silsilah_demo_people'
const LS_UNITS = 'silsilah_demo_units'
const LS_SETTINGS = 'silsilah_demo_settings'

export function loadDemo() {
  try {
    const p = localStorage.getItem(LS_PEOPLE)
    const u = localStorage.getItem(LS_UNITS)
    if (p && u) return { people: JSON.parse(p), units: JSON.parse(u) }
  } catch { /* abaikan */ }
  return { people: structuredClone(DEMO_PEOPLE), units: structuredClone(DEMO_UNITS) }
}

export function saveDemo(people, units) {
  try {
    localStorage.setItem(LS_PEOPLE, JSON.stringify(people))
    localStorage.setItem(LS_UNITS, JSON.stringify(units))
  } catch { /* abaikan */ }
}

export function resetDemo() {
  localStorage.removeItem(LS_PEOPLE)
  localStorage.removeItem(LS_UNITS)
  localStorage.removeItem(LS_SETTINGS)
}

export function loadSettingsDemo() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS)
    if (raw) return JSON.parse(raw)
  } catch { /* abaikan */ }
  return null
}

export function saveSettingsDemo(s) {
  try { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)) } catch { /* abaikan */ }
}

export const DEMO_MODE = DEMO
export const DEMO_ROOT_ID = DEMO_ROOT