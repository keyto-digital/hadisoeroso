import { useStore } from '../lib/store'

export default function Toasts() {
  const { toasts } = useStore()
  if (!toasts.length) return null
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <span>{t.kind === 'ok' ? '✓' : t.kind === 'err' ? '⚠' : 'ℹ'}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}