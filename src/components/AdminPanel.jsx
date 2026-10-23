import { useState, useRef, useEffect } from 'react'
import { TEMA, LATAR } from '../lib/theme'
import { DEFAULT_SETTINGS, uid } from '../lib/settings'
import { fileToWebp } from '../lib/image'
import { useStore } from '../lib/store'

export default function AdminPanel({ settings, onSave, onReset, onClose }) {
  const { mode, inviteUser, listUsers, removeUser, canManageAccess, canEdit, uploadKegiatanPhoto, deleteKegiatanPhoto } = useStore()
  const [tab, setTab] = useState(canManageAccess ? 'tampilan' : 'kegiatan') // tampilan | kegiatan | akses
  useEffect(() => {
    if (!canManageAccess && (tab === 'akses' || tab === 'tampilan')) setTab('kegiatan')
  }, [canManageAccess, tab])
  const [f, setF] = useState(() => structuredClone(settings))
  const [keg, setKeg] = useState(() => structuredClone(settings.kegiatan || []))
  const [editK, setEditK] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgErr, setMsgErr] = useState(false)
  const [uploadingK, setUploadingK] = useState('')
  const photoInputs = useRef({})

  // hak akses
  const [users, setUsers] = useState([])
  const [nEmail, setNEmail] = useState('')
  const [nNama, setNNama] = useState('')
  const [nRole, setNRole] = useState('anggota')
  const [nPass, setNPass] = useState('keluarga123')

  const fileLogo = useRef(null)
  const fileBg = useRef(null)

  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  const kabar = (t, err = false) => { setMsg(t); setMsgErr(err) }

  useEffect(() => {
    if (tab === 'akses' && listUsers) listUsers().then(setUsers).catch(() => {})
  }, [tab, listUsers])

  /* ---- unggah logo & latar ---- */
  const unggahLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try { const r = await fileToWebp(file, 260, 260); set('logo', r.thumbDataUrl) }
    catch (err) { kabar('Gagal memproses logo: ' + err.message, true) }
  }
  const unggahLatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const r = await fileToWebp(file, 1800, 1800)
      setF(s => ({ ...s, latarFoto: r.fullDataUrl, latar: 'foto' }))
    } catch (err) { kabar('Gagal memproses gambar latar: ' + err.message, true) }
  }

  /* ---- simpan utama ---- */
  const simpan = async () => {
    setBusy(true); setMsg('')
    try {
      await onSave({ ...f, kegiatan: keg })
      kabar('✓ Pengaturan tersimpan')
      setTimeout(() => onClose(), 650)
    } catch (err) { kabar('Gagal menyimpan: ' + err.message, true) }
    finally { setBusy(false) }
  }

  /* ---- kegiatan ---- */
  const simpanKeg = (e) => {
    e.preventDefault()
    if (!editK?.judul) return
    const saved = { ...editK, id: editK.id || uid(), photos: Array.isArray(editK.photos) ? editK.photos : [] }
    setKeg(l => l.some(k => k.id === saved.id) ? l.map(k => k.id === saved.id ? saved : k) : [...l, saved])
    setEditK(null)
  }
  const hapusKeg = (k) => {
    if ((k.photos || []).length) {
      kabar('Kegiatan ini memiliki foto kenangan. Kegiatan tidak dapat dihapus agar foto tidak ikut hilang.', true)
      return
    }
    if (confirm('Hapus kegiatan ini?')) setKeg(l => l.filter(x => x.id !== k.id))
  }

  const unggahFotoKegiatan = async (k, file) => {
    if (!file) return
    if (!k.id) { kabar('Simpan kegiatan terlebih dahulu sebelum mengunggah foto.', true); return }
    if (!String(file.type || '').startsWith('image/')) { kabar('Pilih file gambar yang valid.', true); return }
    if (file.size > 20 * 1024 * 1024) { kabar('Ukuran file maksimal 20 MB sebelum dikompres ke WebP.', true); return }
    setUploadingK(k.id); setMsg('')
    try {
      await onSave({ kegiatan: keg })
      const photo = await uploadKegiatanPhoto(k.id, file)
      const next = keg.map(item => item.id === k.id ? { ...item, photos: [...(item.photos || []), photo] } : item)
      await onSave({ kegiatan: next })
      setKeg(next)
      kabar('✓ Foto dikonversi ke WebP dan ditambahkan ke galeri.')
    } catch (err) {
      kabar('Gagal mengunggah foto: ' + (err?.message || 'Kesalahan tidak diketahui'), true)
    } finally {
      setUploadingK('')
      if (photoInputs.current[k.id]) photoInputs.current[k.id].value = ''
    }
  }

  const hapusFotoKegiatan = async (k, photo) => {
    if (!canEdit) {
      kabar('Hanya admin dan superadmin yang boleh menghapus foto.', true)
      return
    }
    if (!deleteKegiatanPhoto) {
      kabar('Fungsi hapus foto belum tersedia. Perbarui store.jsx terlebih dahulu.', true)
      return
    }
    const label = k.judul || 'kegiatan ini'
    if (!confirm(`Hapus foto kenangan dari “${label}”? File thumbnail dan foto penuh akan dihapus dari bucket. Tindakan ini tidak dapat dibatalkan.`)) return
    const oldPhotos = Array.isArray(k.photos) ? k.photos : []
    const nextPhotos = oldPhotos.filter(p => p.id !== photo.id)
    const nextKeg = keg.map(item => item.id === k.id ? { ...item, photos: nextPhotos } : item)
    setBusy(true); setMsg('')
    try {
      // Simpan metadata terlebih dahulu. Jika penghapusan Storage gagal, pulihkan metadata.
      await onSave({ kegiatan: nextKeg })
      try {
        await deleteKegiatanPhoto(k.id, photo)
      } catch (storageErr) {
        try { await onSave({ kegiatan: keg }) } catch (restoreErr) {
          throw new Error(`${storageErr.message}. Pemulihan metadata juga gagal: ${restoreErr.message}`)
        }
        throw storageErr
      }
      setKeg(nextKeg)
      kabar('✓ Foto dan thumbnail berhasil dihapus dari bucket. Kegiatan tetap tersimpan.')
    } catch (err) {
      kabar('Gagal menghapus foto: ' + (err?.message || 'kesalahan tidak diketahui'), true)
    } finally {
      setBusy(false)
    }
  }

  /* ---- hapus akun hak akses ---- */
  const hapusAkses = async (u) => {
    if (!canManageAccess) {
      kabar('Hanya superadmin yang boleh menghapus akun.', true)
      return
    }
    if (!removeUser) {
      kabar('Fitur hapus akun belum tersedia di store/Edge Function.', true)
      return
    }
    const nama = u.nama || u.email || 'akun ini'
    if (!confirm(`Hapus akses akun ${nama} (${u.email})? Akun tidak akan bisa login lagi. Tindakan ini tidak dapat dibatalkan.`)) return

    setBusy(true); setMsg('')
    try {
      await removeUser({ id: u.id, email: u.email })
      if (listUsers) setUsers(await listUsers())
      kabar(`✓ Akun ${u.email} berhasil dihapus`)
    } catch (err) {
      kabar('Gagal menghapus akun: ' + (err?.message || 'kesalahan tidak diketahui'), true)
    } finally {
      setBusy(false)
    }
  }

  /* ---- tambah hak akses ---- */
  const tambahAkses = async (e) => {
    e.preventDefault()
    if (!nEmail || !nNama) return
    setBusy(true); setMsg('')
    try {
      await inviteUser({ email: nEmail, nama: nNama, role: nRole, password: nPass })
      kabar('✓ Akses diberikan ke ' + nNama)
      setNEmail(''); setNNama(''); setNPass('keluarga123')
      if (listUsers) setUsers(await listUsers())
    } catch (err) { kabar(err.message, true) }
    finally { setBusy(false) }
  }

  const pilihLatar = (l) => {
    if (l.id === 'foto' && !f.latarFoto) fileBg.current?.click()
    else set('latar', l.id)
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal admin-modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>⚙️ Pengaturan Administrator</h3>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="tabs">
            {canManageAccess && <button className={`tab ${tab === 'tampilan' ? 'on' : ''}`} onClick={() => setTab('tampilan')}>🎨 Tampilan</button>}
            <button className={`tab ${tab === 'kegiatan' ? 'on' : ''}`} onClick={() => setTab('kegiatan')}>📅 Kegiatan ({keg.length})</button>
            {canManageAccess && <button className={`tab ${tab === 'akses' ? 'on' : ''}`} onClick={() => setTab('akses')}>🔐 Hak Akses</button>}
          </div>

          {msg && <div className={`msg ${msgErr ? 'msg-err' : 'msg-ok'}`}>{msg}</div>}

          {/* ================= TAMPILAN ================= */}
          {tab === 'tampilan' && canManageAccess && (
            <>
              <div className="field">
                <label>Judul silsilah</label>
                <input className="input" value={f.judul} onChange={e => set('judul', e.target.value)} placeholder="cth. Keluarga Besar Wirosoekarto" />
              </div>
              <div className="field">
                <label>Subjudul</label>
                <input className="input" value={f.subjudul} onChange={e => set('subjudul', e.target.value)} placeholder="cth. Jelajahi leluhur & keturunan keluarga" />
              </div>

              <div className="sub-h">👑 Banner Motto</div>
              <div className="field">
                <label>Kutipan motto keluarga</label>
                <input className="input" value={f.motto} onChange={e => set('motto', e.target.value)} placeholder="cth. Bersatu dalam kasih, kuat dalam doa..." />
              </div>
              <div className="field">
                <label>Kredit / sumber motto</label>
                <input className="input" value={f.mottoKredit} onChange={e => set('mottoKredit', e.target.value)} placeholder="cth. — Keluarga Besar Wirosoekarto" />
              </div>

              <div className="sub-h">🖼️ Logo Keluarga</div>
              <div className="logo-row">
                <div className="logo-prev">
                  {f.logo ? <img src={f.logo} alt="Logo" /> : <span style={{ fontSize: 30 }}>👑</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input ref={fileLogo} type="file" accept="image/*" hidden onChange={unggahLogo} />
                  <button className="btn btn-ghost" onClick={() => fileLogo.current?.click()}>Unggah logo</button>
                  {f.logo && <button className="btn btn-danger" onClick={() => set('logo', '')}>Hapus</button>}
                </div>
                <div className="helper">Kosongkan untuk memakai lambang bawaan. Foto otomatis diubah ke format WebP.</div>
              </div>

              <div className="sub-h">🎨 Tema Warna</div>
              <div className="tema-grid">
                {TEMA.map(t => (
                  <button key={t.id} className={`tema-opt ${f.tema === t.id ? 'on' : ''}`} onClick={() => set('tema', t.id)}>
                    <div className="tema-sw">{t.warna.map((w, i) => <i key={i} style={{ background: w }} />)}</div>
                    <div className="n">{t.nama}</div>
                    <div className="k">{t.ket}</div>
                  </button>
                ))}
              </div>

              <div className="sub-h">🧶 Latar Kanvas Pohon</div>
              <div className="tema-grid">
                {LATAR.map(l => (
                  <button key={l.id} className={`tema-opt ${f.latar === l.id ? 'on' : ''}`} onClick={() => pilihLatar(l)}>
                    <div className="n">{l.nama}</div>
                    <div className="k">{l.ket}</div>
                  </button>
                ))}
              </div>
              <input ref={fileBg} type="file" accept="image/*" hidden onChange={unggahLatar} />
              {f.latar === 'foto' && (
                <div className="helper" style={{ marginTop: 8 }}>
                  {f.latarFoto ? '✓ Foto latar terpasang. ' : 'Belum ada foto latar. '}
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => fileBg.current?.click()}>
                    {f.latarFoto ? 'Ganti foto' : 'Pilih foto'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ================= KEGIATAN ================= */}
          {tab === 'kegiatan' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="helper" style={{ margin: 0 }}>Muncul otomatis di widget “Kegiatan Keluarga”.</div>
                <button className="btn btn-gold" style={{ padding: '8px 13px', fontSize: 13 }} onClick={() => setEditK({ id: uid(), judul: '', tanggal: '', tempat: '', keterangan: '', photos: [] })}>
                  ➕ Tambah
                </button>
              </div>

              {editK && (
                <form className="keg-edit" onSubmit={simpanKeg}>
                  <div className="field">
                    <label>Judul kegiatan *</label>
                    <input className="input" required value={editK.judul} onChange={e => setEditK({ ...editK, judul: e.target.value })} placeholder="cth. Halal Bihalal 1447 H" />
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Tanggal</label>
                      <input className="input" type="date" value={editK.tanggal || ''} onChange={e => setEditK({ ...editK, tanggal: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Tempat / lokasi</label>
                      <input className="input" value={editK.tempat || ''} onChange={e => setEditK({ ...editK, tempat: e.target.value })} placeholder="cth. Rumah Bantul" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Keterangan</label>
                    <input className="input" value={editK.keterangan || ''} onChange={e => setEditK({ ...editK, keterangan: e.target.value })} placeholder="cth. Silaturahmi seluruh cabang keluarga" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '9px 16px', fontSize: 13 }}>Simpan</button>
                    <button type="button" className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: 13 }} onClick={() => setEditK(null)}>Batal</button>
                  </div>
                </form>
              )}

              <div className="list-col">
                {keg.map(k => (
                  <div key={k.id} className="list-row">
                    <div>
                      <div className="t">{k.judul}</div>
                      <div className="d">{k.tanggal || 'Tanpa tanggal'} · {k.tempat || 'Tempat belum ditentukan'}</div>
                      {k.keterangan && <div className="d">{k.keterangan}</div>}
                    </div>
                    <div className="acts keg-admin-acts">
                      <input ref={el => { photoInputs.current[k.id] = el }} type="file" accept="image/*" hidden onChange={e => unggahFotoKegiatan(k, e.target.files?.[0])} />
                      <button className="btn btn-gold" style={{ padding: '6px 10px', fontSize: 12 }} disabled={uploadingK === k.id} onClick={() => photoInputs.current[k.id]?.click()}>
                        {uploadingK === k.id ? 'Mengunggah…' : `＋ Foto (${(k.photos || []).length})`}
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 11px', fontSize: 12 }} onClick={() => setEditK(k)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: '6px 11px', fontSize: 12, opacity: (k.photos || []).length ? .45 : 1 }} disabled={(k.photos || []).length > 0} title={(k.photos || []).length ? 'Tidak bisa dihapus karena memiliki foto kenangan' : 'Hapus kegiatan'} onClick={() => hapusKeg(k)}>Hapus</button>
                    </div>
                    {(k.photos || []).length > 0 && <div className="memory-admin-note">❦ {(k.photos || []).length} foto tersimpan · hapus foto hanya jika memang diperlukan.</div>}
                    {(k.photos || []).length > 0 && canEdit && (
                      <div className="memory-admin-photos">
                        {(k.photos || []).map((photo, photoIndex) => (
                          <div className="memory-admin-photo" key={photo.id || photo.fullPath || photoIndex}>
                            <span>Foto {photoIndex + 1}</span>
                            <small>{photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString('id-ID') : 'Foto kenangan'}</small>
                            <button type="button" className="btn btn-danger" style={{ padding: '5px 9px', fontSize: 11 }} disabled={busy || uploadingK === k.id} onClick={() => hapusFotoKegiatan(k, photo)}>Hapus foto</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!keg.length && <div className="helper">Belum ada kegiatan terdaftar.</div>}
              </div>
            </>
          )}

          {/* ================= HAK AKSES ================= */}
          {tab === 'akses' && canManageAccess && (
            <>
              <div className="helper" style={{ marginBottom: 12 }}>
                Superadmin mengelola akun dan peran. <b>Admin</b> bisa mengubah data & tampilan; <b>Anggota</b> hanya bisa melihat dan mengklik foto.
              </div>

              {mode === 'demo' ? (
                <div className="msg msg-info">
                  <b>ℹ️ Mode Demo (belum terhubung Supabase)</b>
                  <div style={{ marginTop: 6, lineHeight: 1.7 }}>
                    Akun contoh: <code>admin@keluarga.id</code> atau <code>anggota@keluarga.id</code><br />
                    Kata sandi: <code>keluarga123</code><br />
                    Setelah terhubung ke Supabase asli, Anda bisa mendaftarkan email saudara dari panel ini.
                  </div>
                </div>
              ) : (
                <>
                  <form className="keg-edit" onSubmit={tambahAkses}>
                    <div className="row">
                      <div className="field">
                        <label>Nama anggota</label>
                        <input className="input" required value={nNama} onChange={e => setNNama(e.target.value)} placeholder="cth. Budi Wirosoekarto" />
                      </div>
                      <div className="field">
                        <label>Email</label>
                        <input className="input" type="email" required value={nEmail} onChange={e => setNEmail(e.target.value)} placeholder="budi@gmail.com" />
                      </div>
                    </div>
                    <div className="row">
                      <div className="field">
                        <label>Kata sandi awal</label>
                        <input className="input" value={nPass} onChange={e => setNPass(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Peran</label>
                        <select className="input" value={nRole} onChange={e => setNRole(e.target.value)}>
                          <option value="anggota">Anggota — lihat saja</option>
                          <option value="admin">Admin — bisa ubah & atur</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 18px' }} disabled={busy}>
                      ➕ Beri Akses
                    </button>
                  </form>

                  <div className="sub-h">Daftar akses terdaftar</div>
                  <div className="list-col">
                    {users.map(u => (
                      <div key={u.id || u.email} className="list-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="t">{u.nama || u.email}</div>
                          <div className="d">{u.email} · peran: <b>{u.role || 'anggota'}</b></div>
                        </div>
                        <div className="acts">
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '6px 11px', fontSize: 12 }}
                            onClick={() => hapusAkses(u)}
                            disabled={busy || !removeUser || String(u.role || '').toLowerCase() === 'superadmin'}
                            title={String(u.role || '').toLowerCase() === 'superadmin' ? 'Akun superadmin dilindungi' : 'Hapus akun'}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                    {!users.length && <div className="helper">Belum ada data akses.</div>}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          {canManageAccess && <button className="btn btn-ghost" onClick={onReset} disabled={busy}>Reset bawaan</button>}
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Tutup</button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={simpan} disabled={busy}>
            {busy ? 'Menyimpan...' : '💾 Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}