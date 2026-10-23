import { useEffect } from 'react'
import { useStore } from './lib/store'
import { terapkanTema } from './lib/theme'
import TreePage from './pages/TreePage'
import Toasts from './components/Toasts'

export default function App() {
  const { ready, settings } = useStore()

  // tema & latar diterapkan di tingkat aplikasi -> halaman login pun ikut bertema
  useEffect(() => {
    if (settings) terapkanTema(settings.tema, settings.latar, settings.latarFoto)
  }, [settings?.tema, settings?.latar, settings?.latarFoto])

  if (!ready) {
    return (
      <div className="login-wrap">
        <div className="login-deco" />
        <div style={{ textAlign: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div className="spinner" style={{ margin: '0 auto 14px', width: 30, height: 30 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>Memuat silsilah…</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <TreePage />
      <Toasts />
    </>
  )
}