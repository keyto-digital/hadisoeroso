/**
 * Pengaturan tampilan yang bisa diubah admin:
 * judul, subjudul, motto (banner), logo, tema, latar, catatan, dan kegiatan keluarga.
 */

export const uid = () => 'x' + Math.random().toString(36).slice(2, 10)

export const DEFAULT_SETTINGS = {
  judul: 'Keluarga Besar Hadi Soeroso',
  subjudul: 'Jelajahi leluhur & keturunan keluarga',
  motto: 'Bersatu dalam kasih, kuat dalam doa, terjaga dalam kenangan.',
  mottoKredit: '— Keluarga Besar Wirosoekarto',
  logo: '',                 // dataURL WebP logo sendiri ('' = pakai lambang bawaan)
  tema: 'zamrud',
  latar: 'batik',
  latarFoto: '',            // dataURL WebP bila latar = 'foto'
  kegiatan: [
    { id: 'k1', judul: 'Halal Bihalal Keluarga Besar', tanggal: '2026-04-12', tempat: 'Rumah Bantul', keterangan: 'Silaturahmi seluruh cabang keluarga, sekaligus ziarah makam leluhur.' },
    { id: 'k2', judul: 'Tasyakuran Khitanan', tanggal: '2026-06-20', tempat: 'Semarang', keterangan: 'Syukuran khitanan putra cabang Semarang.' },
    { id: 'k3', judul: 'Peringatan Haul Eyang', tanggal: '2026-08-05', tempat: 'Makam Keluarga Bantul', keterangan: 'Tahlil bersama dan sedekah makan siang.' },
    { id: 'k4', judul: 'Wisuda Cucu', tanggal: '2026-09-14', tempat: 'Yogyakarta', keterangan: 'Wisuda salah satu cucu generasi ketiga.' },
  ],
}

/** Satukan pengaturan tersimpan dengan default (aman bila ada field baru). */
export function gabungSettings(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SETTINGS)
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    kegiatan: Array.isArray(raw.kegiatan) ? raw.kegiatan : structuredClone(DEFAULT_SETTINGS.kegiatan),
  }
}

/** Urutkan kegiatan: yang akan datang lebih dulu, lalu yang sudah lewat. */
export function kegiatanTerurut(list = []) {
  const hari = new Date().toISOString().slice(0, 10)
  const akan = [], lewat = []
  ;[...list].forEach(k => {
    const t = k.tanggal || ''
    if (!t) { akan.push(k); return }
    if (t >= hari) akan.push(k); else lewat.push(k)
  })
  akan.sort((a, b) => (a.tanggal || '9999').localeCompare(b.tanggal || '9999'))
  lewat.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))
  return { akan, lewat }
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatTanggal(t) {
  if (!t) return ''
  const [y, m, d] = String(t).split('-').map(Number)
  if (!y || !m) return t
  return `${d ? d + ' ' : ''}${BULAN[(m || 1) - 1]} ${y}`
}

export function sisaHari(t) {
  if (!t) return null
  const target = new Date(t + 'T00:00:00')
  if (isNaN(target)) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}