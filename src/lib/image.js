/**
 * Ubah file gambar apa pun (jpg/png/heic-as-jpg) menjadi WebP.
 * Menghasilkan DUA ukuran:
 *  - thumb  : maks 480px  -> dipakai di kartu silsilah (ringan, cepat)
 *  - full   : maks 1600px -> dipakai saat foto diklik (resolusi tinggi)
 * Semua proses lokal di browser (canvas), tidak perlu server.
 */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

function resizeToCanvas(img, maxSide) {
  let { width: w, height: h } = img
  const scale = Math.min(1, maxSide / Math.max(w, h))
  w = Math.round(w * scale)
  h = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
    } else {
      // fallback (browser tua)
      const dataUrl = canvas.toDataURL('image/webp', quality)
      resolve(dataURLtoBlob(dataUrl))
    }
  })
}

function dataURLtoBlob(dataUrl) {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)[1]
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

/**
 * @returns {Promise<{thumb: Blob, full: Blob, width:number, height:number}>}
 */
export async function fileToWebp(file) {
  const img = await loadImage(file)
  const thumbCanvas = resizeToCanvas(img, 480)
  const fullCanvas = resizeToCanvas(img, 1600)
  const [thumb, full] = await Promise.all([
    canvasToWebpBlob(thumbCanvas, 0.78),
    canvasToWebpBlob(fullCanvas, 0.85),
  ])
  return { thumb, full, width: img.naturalWidth, height: img.naturalHeight }
}

export function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(blob)
  })
}

export function humanSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}