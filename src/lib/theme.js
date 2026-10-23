/**
 * Preset tema + pilihan latar.
 * Tema diterapkan lewat atribut data-tema pada <html>, dan CSS di styles.css
 * yang menentukan nilai variabel warna untuk setiap tema.
 */

export const TEMA = [
  {
    id: 'zamrud',
    nama: 'Zamrud Warisan',
    ket: 'Hijau tua hangat + aksen emas — kesan pusaka keluarga',
    warna: ['#0e3b32', '#d9a441', '#faf7f0'],
  },
  {
    id: 'maroon',
    nama: 'Merah Klasik',
    ket: 'Merah marun + emas — kesan khidmat dan sakral',
    warna: ['#4a1220', '#c9a227', '#fbf6ef'],
  },
  {
    id: 'biru',
    nama: 'Biru Elegan',
    ket: 'Biru malam + emas — kesan tenang dan modern',
    warna: ['#111c3a', '#e0b64a', '#f7f8fb'],
  },
  {
    id: 'sepia',
    nama: 'Sepia Antik',
    ket: 'Coklat tua + kuning tua — seperti album foto lama',
    warna: ['#3b2a1e', '#b98a3c', '#f8f2e7'],
  },
]

export const LATAR = [
  { id: 'polos', nama: 'Polos halus', ket: 'Warna tema dengan gradasi lembut' },
  { id: 'titik', nama: 'Titik halus', ket: 'Pola titik rapi khas kanvas' },
  { id: 'batik', nama: 'Motif batik', ket: 'Ornamen kawung khas nusantara' },
  { id: 'kertas', nama: 'Tekstur kertas', ket: 'Serat kertas halus seperti album tua' },
  { id: 'foto', nama: 'Foto sendiri', ket: 'Pakai gambar sendiri sebagai latar' },
]

export const TEMA_IDS = TEMA.map(t => t.id)
export const LATAR_IDS = LATAR.map(l => l.id)

export const temaValid = (id) => (TEMA_IDS.includes(id) ? id : 'zamrud')
export const latarValid = (id) => (LATAR_IDS.includes(id) ? id : 'titik')

/** Terapkan tema + latar ke <html>. */
export function terapkanTema(tema, latar, latarFoto = '') {
  const el = document.documentElement
  const T = temaValid(tema), L = latarValid(latar)
  el.setAttribute('data-tema', T)
  el.setAttribute('data-latar', L)
  // latar foto: pola ditimpa inline (menang atas aturan stylesheet)
  if (L === 'foto' && latarFoto) {
    el.style.setProperty('--canvas-pattern', `url("${latarFoto}")`)
    el.style.setProperty('--canvas-size', 'cover')
  } else {
    el.style.removeProperty('--canvas-pattern')
    el.style.removeProperty('--canvas-size')
  }
}