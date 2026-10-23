/**
 * Tata letak pohon silsilah v2 — "tidy tree" terpusat.
 *
 * Perbedaan dari v1 (pre-order rata kiri):
 *  - Orang tua DIPUSATKAN di atas anak-anaknya -> pohon terlihat seimbang.
 *  - Setelah dipusatkan, tiap generasi diperiksa & digeser agar tidak bertumpuk.
 *  - Hasil: kanvas lebih kompak + hubungan orang tua-anak langsung terlihat.
 * Sumbu Y tetap = generasi (kakek-nenek paling atas).
 */

export const CARD_W = 150
export const CARD_H = 214
export const NODE_H = CARD_H          // tinggi satu baris kartu (harus = CARD_H, jika tidak -> kartu bertumpuk)
export const GAP_SIBLING = 26
export const GAP_SPOUSE = 24
export const GAP_GEN = 76             // jarak vertikal antar generasi
export const PAD = 70

const unitWidth = (u) => (u.partnerIds.length >= 2 ? CARD_W * 2 + GAP_SPOUSE : CARD_W)

/** Ukuran "sub-pohon" tiap unit (lebar total keturunannya). */
function hitungLebar(units, uid, memo = {}) {
  if (memo[uid] !== undefined) return memo[uid]
  const u = units.find(x => x.id === uid)
  if (!u) return 0
  const own = unitWidth(u)
  const kids = u.childUnitIds.map(c => hitungLebar(units, c, memo))
  // lebar anak-anak bila berjajar + jarak antar mereka
  const kidsWidth = kids.length
    ? kids.reduce((a, b) => a + b, 0) + GAP_SIBLING * (kids.length - 1)
    : 0
  memo[uid] = Math.max(own, kidsWidth)
  return memo[uid]
}

export function layoutTree(units, rootId) {
  if (!units.length) return { nodes: [], edges: [], width: 0, height: 0, unitIndex: {}, depthOf: {} }

  const byId = Object.fromEntries(units.map(u => [u.id, u]))
  const memo = {}

  // ---- kedalaman generasi ----
  const depthOf = {}
  const setDepth = (uid, d) => {
    if (!byId[uid] || depthOf[uid] !== undefined) return
    depthOf[uid] = d
    byId[uid].childUnitIds.forEach(c => setDepth(c, d + 1))
  }
  setDepth(rootId, 0)
  units.forEach(u => { if (depthOf[u.id] === undefined) depthOf[u.id] = 0 })

  // ---- posisi relatif (rekursif, orang tua di tengah anak) ----
  const relX = {}
  const place = (uid) => {
    const u = byId[uid]
    if (!u) return
    const uw = unitWidth(u)
    if (!u.childUnitIds.length) {
      relX[uid] = 0
      return
    }
    u.childUnitIds.forEach(place)
    // posisi anak pertama
    let cursor = 0
    u.childUnitIds.forEach((cid, i) => {
      const cw = hitungLebar(units, cid, memo)
      const childUw = unitWidth(byId[cid])
      relX[cid] = cursor + (cw - childUw) / 2   // pusatkan unit anak di dalam sub-pohonnya
      cursor += cw + GAP_SIBLING
    })
    const first = relX[u.childUnitIds[0]]
    const last = relX[u.childUnitIds[u.childUnitIds.length - 1]] + unitWidth(byId[u.childUnitIds[u.childUnitIds.length - 1]])
    const mid = (first + last) / 2
    relX[uid] = Math.max(0, mid - uw / 2)
    // geser seluruh anak bila orang tua lebih lebar dan melewati batas kiri
    if (relX[uid] === 0 && mid - uw / 2 < 0) {
      const shift = uw / 2 - mid
      u.childUnitIds.forEach(cid => { relX[cid] += shift })
    }
  }
  place(rootId)

  // normalkan ke kiri
  const minX = Math.min(...Object.values(relX))
  Object.keys(relX).forEach(k => { relX[k] -= minX })

  // ---- susun semua unit, resolusi tumpang tindih per generasi ----
  const byDepth = {}
  units.forEach(u => { (byDepth[depthOf[u.id]] ||= []).push(u.id) })
  Object.keys(byDepth).forEach(d => {
    byDepth[d].sort((a, b) => relX[a] - relX[b])
    let batas = -Infinity
    byDepth[d].forEach(uid => {
      const u = byId[uid], uw = unitWidth(u)
      if (relX[uid] < batas) relX[uid] = batas
      batas = relX[uid] + uw + GAP_SIBLING
    })
  })

  // ---- hasil akhir ----
  const unitIndex = {}
  const nodes = []
  units.forEach((u, i) => {
    unitIndex[u.id] = i
    const y = PAD + depthOf[u.id] * (NODE_H + GAP_GEN)
    const x = PAD + relX[u.id]
    const isPair = u.partnerIds.length >= 2
    let px = x
    u.partnerIds.forEach((pid, k) => {
      nodes.push({
        personId: pid, unitId: u.id, x: px, y,
        w: CARD_W, h: CARD_H, depth: depthOf[u.id],
        isRoot: u.id === rootId, side: isPair ? (k === 0 ? 'L' : 'P') : 'single',
      })
      px += CARD_W + GAP_SPOUSE
    })
  })

  // ---- garis penghubung ----
  const edges = []
  units.forEach(u => {
    const isPair = u.partnerIds.length >= 2
    const uw = unitWidth(u)
    const ux = PAD + relX[u.id]
    const uy = PAD + depthOf[u.id] * (NODE_H + GAP_GEN)
    if (isPair) {
      edges.push({ type: 'marriage', x1: ux + CARD_W, y1: uy + NODE_H / 2, x2: ux + CARD_W + GAP_SPOUSE, y2: uy + NODE_H / 2 })
    }
    if (!u.childUnitIds.length) return
    const midX = ux + uw / 2
    const busY = uy + NODE_H + GAP_GEN / 2
    edges.push({ type: 'stem', x1: midX, y1: uy + NODE_H, x2: midX, y2: busY, trunk: true })
    const childXs = u.childUnitIds.map(cid => {
      const cu = byId[cid]
      return PAD + relX[cid] + unitWidth(cu) / 2
    })
    if (childXs.length > 1) {
      edges.push({ type: 'bus', x1: Math.min(...childXs), y1: busY, x2: Math.max(...childXs), y2: busY, trunk: true })
    }
    childXs.forEach(cx => {
      edges.push({ type: 'drop', x1: cx, y1: busY, x2: cx, y2: busY + GAP_GEN / 2 })
    })
  })

  const maxRight = Math.max(...nodes.map(n => n.x + n.w))
  const maxDepth = Math.max(0, ...Object.values(depthOf))
  return {
    nodes, edges,
    width: maxRight + PAD,
    height: PAD + maxDepth * (NODE_H + GAP_GEN) + CARD_H + PAD,
    unitIndex, depthOf,
  }
}

/** Cari jalur dari akar ke seseorang (untuk fitur "sorot jalur"). */
export function pathToPerson(units, rootId, personId) {
  const target = units.find(u => u.partnerIds.includes(personId))
  if (!target) return []
  const chain = []
  let cur = target.id
  const guard = new Set()
  while (cur && !guard.has(cur)) {
    guard.add(cur)
    chain.unshift(cur)
    if (cur === rootId) break
    const u = units.find(x => x.id === cur)
    cur = u ? u.parentUnitId : null
  }
  return chain
}