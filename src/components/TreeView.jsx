import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { layoutTree } from '../lib/tree'
import PersonCard from './PersonCard'

const MIN = 0.22
const MAX = 1.8
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const getMidpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const getDistance = (a, b) => Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))

export default function TreeView({ people, units, rootId, onOpen, highlightPath, showBirth = false }) {
  const byId = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people])
  // Penting: layout harus stabil antar-render agar fit tidak berubah identitas dan memicu loop useEffect.
  const layout = useMemo(() => layoutTree(units, rootId), [units, rootId])
  const [tf, setTf] = useState({ x: 0, y: 0, k: 1 })
  const [dragging, setDragging] = useState(false)
  const vpRef = useRef(null)
  const didFit = useRef(false)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const suppressClickUntil = useRef(0)
  const highlighted = new Set(highlightPath || [])

  const fit = useCallback(() => {
    const vp = vpRef.current
    if (!vp || !layout.width || !layout.height) return
    const W = vp.clientWidth
    const H = vp.clientHeight
    const small = W < 720
    const pad = small ? 24 : 40
    const gutter = small ? 96 : 118
    const kx = Math.max(0.01, (W - pad * 2) / layout.width)
    const ky = Math.max(0.01, (H - gutter - pad) / layout.height)
    const k = clamp(Math.min(1, kx, ky), small ? 0.75 : 0.42, 1)
    const roots = layout.nodes.filter(n => n.isRoot)
    const rootX = roots.length
      ? (Math.min(...roots.map(n => n.x)) + Math.max(...roots.map(n => n.x + n.w))) / 2
      : layout.width / 2
    const remaining = H - gutter - layout.height * k
    setTf({ x: W / 2 - rootX * k, y: remaining > 8 ? gutter + remaining / 2 : gutter, k })
  }, [layout.width, layout.height, layout.nodes])

  useEffect(() => {
    didFit.current = false
    fit()
    didFit.current = true
  }, [rootId, fit])

  useEffect(() => {
    const el = vpRef.current
    if (!el) return
    const onResize = () => fit()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    observer?.observe(el)
    window.addEventListener('resize', onResize)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [fit])

  const zoomAt = useCallback((factor, cx, cy) => {
    setTf(t => {
      const k = clamp(t.k * factor, MIN, MAX)
      const ratio = k / t.k
      return { k, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio }
    })
  }, [])

  const onWheel = useCallback(e => {
    e.preventDefault()
    const el = vpRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top)
  }, [zoomAt])

  useEffect(() => {
    const el = vpRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const onPointerDown = e => {
    if (e.target.closest('.zoom-ctl')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const el = vpRef.current
    if (!el) return
    // Capture on the viewport so moving outside the original touch target doesn't lose the gesture.
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    // Jangan capture pointer pada klik biasa: capture di viewport dapat
    // mengalihkan target klik dari PersonCard. Capture dilakukan saat drag dimulai.
    const pts = Array.from(pointers.current.values()).slice(0, 2)
    if (pts.length === 2) {
      const mid = getMidpoint(pts[0], pts[1])
      const rect = el.getBoundingClientRect()
      gesture.current = {
        type: 'pinch', startDistance: getDistance(pts[0], pts[1]), startK: tf.k,
        startMidX: mid.x - rect.left, startMidY: mid.y - rect.top, startX: tf.x, startY: tf.y, moved: false,
      }
      setDragging(true)
    } else {
      gesture.current = { type: 'pan', pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, tx: tf.x, ty: tf.y, moved: false }
    }
  }

  const onPointerMove = e => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    const el = vpRef.current
    if (!el) return
    const pts = Array.from(pointers.current.values()).slice(0, 2)
    const g = gesture.current

    if (pts.length >= 2 && g?.type === 'pinch') {
      const mid = getMidpoint(pts[0], pts[1])
      const rect = el.getBoundingClientRect()
      const mx = mid.x - rect.left
      const my = mid.y - rect.top
      const k = clamp(g.startK * getDistance(pts[0], pts[1]) / g.startDistance, MIN, MAX)
      const ratio = k / g.startK
      setTf({ k, x: mx - (g.startMidX - g.startX) * ratio, y: my - (g.startMidY - g.startY) * ratio })
      g.moved = true
      setDragging(true)
      return
    }

    if (g?.type === 'pan' && g.pointerId === e.pointerId) {
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        if (!g.moved) {
          // Setelah gerakan melewati ambang drag, capture agar geser tetap
          // berjalan meskipun pointer keluar dari viewport.
          try { el.setPointerCapture(e.pointerId) } catch {}
        }
        g.moved = true
        setDragging(true)
        setTf(t => ({ x: g.tx + dx, y: g.ty + dy, k: t.k }))
      }
    }
  }

  const onPointerEnd = e => {
    const g = gesture.current
    if (g?.moved) suppressClickUntil.current = Date.now() + 350
    pointers.current.delete(e.pointerId)
    const remaining = Array.from(pointers.current.entries())
    if (remaining.length === 1) {
      const [pointerId, p] = remaining[0]
      gesture.current = { type: 'pan', pointerId, startX: p.x, startY: p.y, tx: tf.x, ty: tf.y, moved: false }
    } else if (remaining.length >= 2) {
      const pts = Array.from(pointers.current.values()).slice(0, 2)
      const mid = getMidpoint(pts[0], pts[1])
      const rect = vpRef.current?.getBoundingClientRect()
      gesture.current = {
        type: 'pinch', startDistance: getDistance(pts[0], pts[1]), startK: tf.k,
        startMidX: rect ? mid.x - rect.left : mid.x, startMidY: rect ? mid.y - rect.top : mid.y,
        startX: tf.x, startY: tf.y, moved: false,
      }
    } else {
      gesture.current = null
      setDragging(false)
    }
  }

  const resetZoom = () => setTf(t => {
    const vp = vpRef.current
    if (!vp) return t
    const cx = vp.clientWidth / 2
    const cy = vp.clientHeight / 2
    return { x: cx - (cx - t.x) / t.k, y: cy - (cy - t.y) / t.k, k: 1 }
  })

  const stopControlPointer = e => e.stopPropagation()

  return (
    <div
      ref={vpRef}
      className={`tree-viewport${dragging ? ' dragging' : ''}`}
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
    >
      <div className="tree-canvas" style={{ transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.k})`, transformOrigin: '0 0' }}>
        <svg className="tree-svg" width={layout.width} height={layout.height}>
          {layout.edges.map((edge, i) => <path key={i} className={edge.trunk ? 'trunk' : ''} d={`M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`} />)}
        </svg>
        {layout.nodes.map(n => {
          const p = byId[n.personId]
          if (!p) return null
          return <PersonCard key={n.personId} person={p} x={n.x} y={n.y} isRoot={n.isRoot}
            highlighted={highlighted.has(n.unitId)} showBirth={showBirth}
            onClick={id => { if (Date.now() < suppressClickUntil.current) return; onOpen?.(id) }} />
        })}
      </div>
      <div className="zoom-ctl" onPointerDown={stopControlPointer}>
        <button type="button" className="zoom-btn" title="Perbesar" onClick={() => { const v = vpRef.current; if (v) zoomAt(1.2, v.clientWidth / 2, v.clientHeight / 2) }}>+</button>
        <button type="button" className="zoom-btn" title="Perkecil" onClick={() => { const v = vpRef.current; if (v) zoomAt(1 / 1.2, v.clientWidth / 2, v.clientHeight / 2) }}>−</button>
        <button type="button" className="zoom-btn" title="Sesuaikan layar" onClick={fit} style={{ fontSize: 15 }}>⤢</button>
        <button type="button" className="zoom-btn" title="Reset zoom" onClick={resetZoom} style={{ fontSize: 15 }}>◎</button>
      </div>
    </div>
  )
}
