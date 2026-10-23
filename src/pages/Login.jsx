import { useState } from 'react'
import { useStore } from '../lib/store'
import { DEMO_USERS } from '../lib/demoData'

export default function Login({ onBack }) {
  const { signIn, mode, settings } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await signIn(email, password)
    } catch (e2) {
      setErr(e2?.message || 'Gagal masuk.')
    } finally {
      setBusy(false)
    }
  }

  async function masukDemo(u) {
    setErr(''); setEmail(u.email); setPassword(u.password); setBusy(true)
    try { await signIn(u.email, u.password) }
    catch (e2) { setErr(e2?.message || 'Gagal masuk.') }
    finally { setBusy(false) }
  }

  return (
    <div className="login-wrap">
      <div className="login-deco" />
      <form className="login-card" onSubmit={submit} style={{ position: 'relative', zIndex: 2 }}>
        {onBack && (
          <button type="button" className="btn btn-ghost" style={{ width: 'auto', marginBottom: 12 }} onClick={onBack}>
            ← Kembali ke silsilah
          </button>
        )}
        <div className="login-brand">
          <div className="login-logo">
            {settings?.logo
              ? <img src={settings.logo} alt="logo" />
              : <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v5M6 21v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 15V9a6 6 0 0 1 12 0v6"
                    stroke="#3a2a06" strokeWidth="1.9" strokeLinecap="round" />
                  <circle cx="12" cy="4" r="2" fill="#3a2a06" />
                  <circle cx="6" cy="20" r="2" fill="#3a2a06" />
                  <circle cx="18" cy="20" r="2" fill="#3a2a06" />
                </svg>}
          </div>
          <div>
            <h1 className="login-title">{settings?.judul || 'Silsilah Keluarga'}</h1>
            <p className="login-sub">{settings?.subjudul || 'Jelajahi leluhur & keturunan keluarga'}</p>
          </div>
          {mode === 'demo' && <span className="demo-badge">◆ Mode Demo</span>}
        </div>

        {err && <div className="msg msg-err">{err}</div>}
        {mode === 'demo' && (
          <div className="msg msg-info">
            Ini <b>mode demo</b> — data contoh tersimpan di perangkat Anda.
            {DEMO_USERS.map(u => (
              <div key={u.email} style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5, padding: '7px 10px' }}
                  onClick={() => masukDemo(u)} disabled={busy}>
                  Masuk sebagai {u.role} →
                </button>
                {' '}<span style={{ fontSize: 12 }}>{u.email} / {u.password}</span>
              </div>
            ))}
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@keluarga.id" autoComplete="email" required />
        </div>
        <div className="field">
          <label>Kata sandi</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? <><span className="spinner" /> Memeriksa...</> : 'Masuk'}
        </button>

        <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          Akses hanya untuk anggota keluarga yang diberi izin.<br />
          Belum punya akses? Hubungi admin keluarga.
        </p>
      </form>
    </div>
  )
}