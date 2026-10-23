import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../lib/store'
import { pathToPerson, layoutTree } from '../lib/tree'
import { terapkanTema } from '../lib/theme'
import TreeView from '../components/TreeView'
import PersonDetail from '../components/PersonDetail'
import PersonForm from '../components/PersonForm'
import Lightbox from '../components/Lightbox'
import Widgets, { GaleriKegiatan } from '../components/Widgets'
import AdminPanel from '../components/AdminPanel'
import Login from './Login'
import { photoOf, initials } from '../lib/helpers'

export default function TreePage() {
  const store = useStore()
  const {
    people, units, rootId, user, canEdit, signOut, addPerson, updatePerson, deletePerson,
    resetData, mode, settings, updateSettings, resetSettings, getKegiatanPhotoUrl,
  } = store

  const demoMode = mode === 'demo'


  const [selectedId, setSelectedId] = useState(null)
  const [photoPerson, setPhotoPerson] = useState(null)
  const [galleryKegiatan, setGalleryKegiatan] = useState(null)
  const [editPerson, setEditPerson] = useState(null)
  const [addRel, setAddRel] = useState(null)
  const [q, setQ] = useState('')
  const [highlight, setHighlight] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const byId = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people])

  // Tombol Escape menutup lapisan yang sedang terbuka (UX standar).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (menuOpen) { setMenuOpen(false); return }
      if (widgetsOpen) { setWidgetsOpen(false); return }
      if (photoPerson) { setPhotoPerson(null); return }
      if (showAdmin) { setShowAdmin(false); return }
      if (addRel || editPerson) { setAddRel(null); setEditPerson(null); return }
      if (selectedId) setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, widgetsOpen, photoPerson, showAdmin, addRel, editPerson, selectedId])

  // terapkan tema + latar setiap pengaturan berubah
  useEffect(() => { terapkanTema(settings.tema, settings.latar, settings.latarFoto) }, [settings.tema, settings.latar, settings.latarFoto])

  useEffect(() => { if (user) setShowLogin(false) }, [user])

  const layout = useMemo(() => layoutTree(units, rootId), [units, rootId])
  const maxDepth = useMemo(() => Math.max(0, ...Object.values(layout.depthOf || {})), [layout])

  const pathSet = useMemo(() => {
    if (!highlight || !selectedId) return []
    return pathToPerson(units, rootId, selectedId)
  }, [highlight, selectedId, units, rootId])

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return people.filter(p =>
      p.nama.toLowerCase().includes(s) ||
      (p.kota || '').toLowerCase().includes(s) ||
      (user && String(p.lahir || '').includes(s))
    ).slice(0, 8)
  }, [q, people, user])

  function pilihOrang(id) { setSelectedId(id); setQ('') }

  async function handleSave(form) {
    if (addRel) { await addPerson(form, addRel); setAddRel(null) }
    else if (editPerson) { await updatePerson(editPerson.id, form); setEditPerson(null) }
  }

  async function handleDelete(p) {
    await deletePerson(p.id); setEditPerson(null); setSelectedId(null)
  }

  const totalHidup = people.filter(p => !p.wafat).length

  return (
    <div className="app">
      {/* ---------------- TOPBAR ---------------- */}
      <header className="topbar">
        <div className="topbar-logo">
          {settings.logo
            ? <img src={settings.logo} alt="logo" />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v5M6 21v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 15V9a6 6 0 0 1 12 0v6"
                  stroke="#3a2a06" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="4" r="2" fill="#3a2a06" />
                <circle cx="6" cy="20" r="2" fill="#3a2a06" />
                <circle cx="18" cy="20" r="2" fill="#3a2a06" />
              </svg>}
        </div>
        <div className="topbar-id">
          <div className="topbar-name">{settings.judul}</div>
          <div className="topbar-sub">{settings.subjudul} · {people.length} anggota · {totalHidup} masih hidup</div>
        </div>
        <div className="topbar-spacer" />

        {user ? (
          <span className="chip" title={`${user.nama || user.email}${user.role === 'admin' ? ' · admin' : ''}`}>
            👤 <span className="chip-nama">{user.nama || user.email}</span>
            {user.role === 'admin' && <b className="chip-role" style={{ color: 'var(--gold-300)' }}>· admin</b>}
          </span>
        ) : (
          <button className="btn btn-gold public-login-btn" onClick={() => setShowLogin(true)}>Masuk anggota</button>
        )}

        {canEdit && (
          <button className="icon-btn only-wide" title="Tambah anggota keluarga"
            onClick={() => setAddRel({ type: selectedId ? 'anak' : 'root', id: selectedId || rootId })}>+</button>
        )}
        {canEdit && (
          <button className="icon-btn only-wide" title="Pengaturan administrator" onClick={() => setShowAdmin(true)}>⚙️</button>
        )}
        <button className="icon-btn active widgets-toggle" title="Panel informasi" onClick={() => setWidgetsOpen(v => !v)}>☰</button>

        {/* desktop: tombol keluar langsung | HP: satu tombol menu */}
        {user && <button className="icon-btn only-wide" title="Keluar" onClick={signOut}>⎋</button>}
        <div className="menu-wrap only-narrow">
          <button className="icon-btn active" title="Menu lain" onClick={() => setMenuOpen(v => !v)}>⋯</button>
          {menuOpen && (
            <>
              <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
              <div className="topbar-menu">
                {canEdit && (
                  <button onClick={() => { setMenuOpen(false); setAddRel({ type: selectedId ? 'anak' : 'root', id: selectedId || rootId }) }}>
                    ➕ Tambah anggota
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => { setMenuOpen(false); setShowAdmin(true) }}>⚙️ Pengaturan admin</button>
                )}
                <button onClick={() => { setMenuOpen(false); setWidgetsOpen(v => !v) }}>📋 Panel informasi</button>
                {user
                  ? <button onClick={signOut}>⎋ Keluar</button>
                  : <button onClick={() => { setMenuOpen(false); setShowLogin(true) }}>🔐 Masuk anggota</button>}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ---------------- TOOLBAR ---------------- */}
      <div className="toolbar">
        <div style={{ position: 'relative' }}>
          <input className="input" value={q} onChange={e => setQ(e.target.value)}
            placeholder="🔍 Cari nama, kota, atau tahun..." />
          {matches.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 330, background: 'var(--paper-2)',
              borderRadius: 12, boxShadow: 'var(--shadow-md)', border: '1px solid var(--line)', zIndex: 40, overflow: 'hidden',
            }}>
              {matches.map(p => (
                <button key={p.id} onClick={() => pilihOrang(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                  {photoOf(p, 'thumb')
                    ? <img src={photoOf(p, 'thumb')} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} />
                    : <span className="av" style={{ width: 30, height: 30, borderRadius: 8, fontSize: 12, display: 'grid', placeItems: 'center', background: 'var(--brand-600)', color: '#fff', fontWeight: 800 }}>{initials(p.nama)}</span>}
                  <span style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nama}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>📍 {p.kota || '—'}{user && p.lahir ? ` · ${p.lahir}` : ''}</div>
                  </span>
                  {p.wafat && <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)' }}>wafat</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`btn ${highlight ? 'btn-gold' : 'btn-ghost'}`} style={{ fontSize: 13.5, padding: '9px 14px' }}
          onClick={() => setHighlight(v => !v)} title="Sorot jalur keturunan dari leluhur">
          {highlight ? '✦ Jalur aktif' : 'Jalur nonaktif'}
        </button>

        <div className="topbar-spacer" />

        <div className="legend">
          <span><span className="dot" style={{ background: 'var(--ok)' }} />Hidup</span>
          <span><span className="dot" style={{ background: '#9aa3b2' }} />Wafat</span>
          <span><span className="dot" style={{ background: 'var(--gold-400)' }} />Leluhur</span>
        </div>

        {mode === 'demo' && canEdit && (
          <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '8px 12px' }} onClick={resetData} title="Kembalikan data contoh ke awal">
            ↺ Reset demo
          </button>
        )}
      </div>

      {/* ---------------- MAIN ---------------- */}
      <div className="main">
        <div className="canvas-wrap">
          {people.length === 0
            ? (
              <div className="empty">
                <div style={{ fontSize: 46 }}>🌳</div>
                <h3>Belum ada data keluarga</h3>
                <p>Mulai dengan menambahkan leluhur (kakek-nenek) sebagai akar silsilah.</p>
                {canEdit && <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => setAddRel({ type: 'root', id: null })}>+ Tambah Leluhur</button>}
              </div>
            )
            : <TreeView
                people={people}
                units={units}
                rootId={rootId}
                onOpen={user ? setSelectedId : undefined}
                highlightPath={pathSet}
                showBirth={!!user}
              />}

          {/* dekorasi ornamen */}
          {people.length > 0 && <>
            <span className="orn orn-tl">❧</span>
            <span className="orn orn-br">❧</span>
          </>}

          {/* banner motto */}
          {people.length > 0 && settings.motto && (
            <div className="motto-banner">
              <div className="motto-eyebrow"><span className="motto-fleuron">❦</span> Motto Keluarga <span className="motto-fleuron">❦</span></div>
              <div className="motto-text">“{settings.motto}”</div>
              {settings.mottoKredit && <div className="motto-credit">{settings.mottoKredit}</div>}
            </div>
          )}
        </div>

        <Widgets
          open={widgetsOpen}
          onClose={() => setWidgetsOpen(false)}
          people={people}
          units={units}
          rootId={rootId}
          layoutDepth={maxDepth}
          kegiatan={settings.kegiatan}
          onEditKegiatan={() => { setWidgetsOpen(false); setShowAdmin(true) }}
          onOpenGallery={setGalleryKegiatan}
          canEdit={canEdit}
        />
      </div>

      <div className="footer-note">
        <span>💡 Klik kartu untuk melihat detail</span>
        <span>🖱️ Geser untuk menjelajah · gulir/pinch untuk zoom</span>
        <span>🖼️ Klik foto untuk tampilan resolusi penuh</span>
        {mode === 'demo' && <span>◆ Data demo tersimpan di perangkat ini</span>}
      </div>

      {/* ---------------- OVERLAYS ---------------- */}
      {user && selectedId && byId[selectedId] && !editPerson && !addRel && (
        <PersonDetail
          person={byId[selectedId]}
          people={people}
          units={units}
          onClose={() => setSelectedId(null)}
          onSelect={setSelectedId}
          onShowPhoto={setPhotoPerson}
          canEdit={canEdit}
          onEdit={(p) => setEditPerson(p)}
          onAddChild={(p) => setAddRel({ type: 'anak', id: units.find(u => u.partnerIds.includes(p.id))?.id })}
          onAddSpouse={(p) => setAddRel({ type: 'pasangan', id: units.find(u => u.partnerIds.includes(p.id))?.id })}
        />
      )}
      

      {(addRel || editPerson) && (
        <PersonForm
          initial={editPerson}
          units={units}
          people={people}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setAddRel(null); setEditPerson(null) }}
        />
      )}

      {user && photoPerson && <Lightbox person={photoPerson} onClose={() => setPhotoPerson(null)} />}
      {user && galleryKegiatan && <GaleriKegiatan kegiatan={galleryKegiatan} getPhotoUrl={getKegiatanPhotoUrl} onClose={() => setGalleryKegiatan(null)} />}

      {showAdmin && (user?.role === 'admin' || user?.role === 'superadmin') && (
        <AdminPanel
          settings={settings}
          onSave={updateSettings}
          onReset={resetSettings}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {showLogin && !user && (
        <div className="login-overlay">
          <Login onBack={() => setShowLogin(false)} />
        </div>
      )}
    </div>
  )
}