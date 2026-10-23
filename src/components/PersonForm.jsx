import { useState } from 'react'
import { fileToWebp, blobToDataURL, humanSize } from '../lib/image'
import { photoOf } from '../lib/helpers'

/** Form tambah/ubah anggota. Foto otomatis dikonversi ke WebP saat dipilih. */
export default function PersonForm({
  initial, units, people, onSave, onDelete, onClose,
}) {
  const [f, setF] = useState({
    nama: initial?.nama || '',
    kota: initial?.kota || '',
    gender: initial?.gender || 'L',
    lahir: initial?.lahir || '',
    wafat: initial?.wafat || false,
    wafatTahun: initial?.wafatTahun || '',
    pekerjaan: initial?.pekerjaan || '',
    catatan: initial?.catatan || '',
  })
  const [preview, setPreview] = useState(photoOf(initial, 'thumb'))
  // hasil konversi WebP: { thumbDataUrl, fullDataUrl, info }
  const [webp, setWebp] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const isEdit = !!initial?.id
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  async function pilihFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    if (!file.type.startsWith('image/')) { setErr('File harus berupa gambar (JPG/PNG/WebP).'); return }
    setBusy(true)
    try {
      const { thumb, full, width, height } = await fileToWebp(file)
      const [thumbUrl, fullUrl] = await Promise.all([blobToDataURL(thumb), blobToDataURL(full)])
      setPreview(thumbUrl)
      setWebp({
        thumbDataUrl: thumbUrl, fullDataUrl: fullUrl,
        info: { nama: file.name, asli: file.size, thumb: thumb.size, full: full.size, width, height },
      })
    } catch (e) {
      setErr('Gagal memproses gambar: ' + (e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  async function simpan() {
    if (!f.nama.trim()) { setErr('Nama wajib diisi.'); return }
    if (f.wafat && f.wafatTahun && f.lahir && Number(f.wafatTahun) < Number(f.lahir)) {
      setErr('Tahun wafat tidak boleh lebih awal dari tahun lahir.'); return
    }
    setBusy(true); setErr('')
    try {
      await onSave({
        ...f,
        lahir: f.lahir ? Number(f.lahir) : null,
        wafatTahun: f.wafat && f.wafatTahun ? Number(f.wafatTahun) : null,
        webp,
      })
    } catch (e) {
      setErr('Gagal menyimpan: ' + (e?.message || e)); setBusy(false)
    }
  }

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? 'Ubah Data Anggota' : 'Tambah Anggota Keluarga'}</h3>
          <button className="close-x" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-body">
          {err && <div className="msg msg-err">{err}</div>}

          <div className="field">
            <label>Foto (otomatis dikonversi ke WebP — hemat & tajam)</label>
            {preview
              ? (
                <div className="upload-preview">
                  <img src={preview} alt="pratinjau" />
                  <div style={{ flex: 1 }}>
                    {webp
                      ? <>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>Siap diunggah ✅</div>
                          <div className="file-meta">
                            {webp.info.nama} · {webp.info.width}×{webp.info.height}px<br />
                            Asli {humanSize(webp.info.asli)} → WebP kecil {humanSize(webp.info.thumb)} / besar {humanSize(webp.info.full)}
                          </div>
                        </>
                      : <div className="file-meta">Foto saat ini.</div>}
                    <label className="btn btn-ghost" style={{ marginTop: 8, fontSize: 13, padding: '8px 12px', display: 'inline-flex' }}>
                      🔁 Ganti foto
                      <input type="file" accept="image/*" hidden onChange={pilihFoto} />
                    </label>
                  </div>
                </div>
              )
              : (
                <label className="upload">
                  <div style={{ fontSize: 30 }}>🖼️</div>
                  <div style={{ fontWeight: 600, marginTop: 6 }}>{busy ? 'Memproses foto…' : 'Klik untuk pilih foto'}</div>
                  <div className="helper">JPG / PNG · otomatis jadi WebP (versi kecil & resolusi tinggi)</div>
                  <input type="file" accept="image/*" hidden onChange={pilihFoto} />
                </label>
              )}
          </div>

          <div className="field">
            <label>Nama lengkap *</label>
            <input className="input" value={f.nama} onChange={e => set('nama', e.target.value)} placeholder="cth. H. Soedarmo Wirosoekarto" />
          </div>

          <div className="grid2">
            <div className="field">
              <label>Kota tinggal</label>
              <input className="input" value={f.kota} onChange={e => set('kota', e.target.value)} placeholder="cth. Yogyakarta" />
            </div>
            <div className="field">
              <label>Jenis kelamin</label>
              <select className="input" value={f.gender} onChange={e => set('gender', e.target.value)}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <label>Tahun lahir</label>
              <input className="input" type="number" value={f.lahir} onChange={e => set('lahir', e.target.value)} placeholder="cth. 1928" />
            </div>
            <div className="field">
              <label>Pekerjaan</label>
              <input className="input" value={f.pekerjaan} onChange={e => set('pekerjaan', e.target.value)} placeholder="cth. Petani" />
            </div>
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
              <input type="checkbox" checked={f.wafat} onChange={e => set('wafat', e.target.checked)} style={{ width: 18, height: 18 }} />
              Sudah meninggal dunia
            </label>
          </div>

          {f.wafat && (
            <div className="field">
              <label>Tahun wafat</label>
              <input className="input" type="number" value={f.wafatTahun} onChange={e => set('wafatTahun', e.target.value)} placeholder="cth. 2003" />
            </div>
          )}

          <div className="field">
            <label>Catatan / cerita keluarga</label>
            <textarea className="input" rows={3} value={f.catatan} onChange={e => set('catatan', e.target.value)} placeholder="Cerita singkat, kenangan, atau keterangan lain…" style={{ resize: 'vertical' }} />
          </div>

          {isEdit && (
            <div className="field" style={{ marginTop: 6 }}>
              {!showDelete
                ? <button className="btn btn-danger" style={{ fontSize: 13, padding: '8px 12px' }} onClick={() => setShowDelete(true)}>🗑️ Hapus anggota ini</button>
                : (
                  <div className="msg msg-err" style={{ marginBottom: 0 }}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>Yakin hapus <b>{initial.nama}</b>? Data tidak bisa dikembalikan.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-danger" onClick={() => onDelete(initial)}>Ya, hapus</button>
                      <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Batal</button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Batal</button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={simpan} disabled={busy}>
            {busy ? <><span className="spinner" /> Menyimpan…</> : (isEdit ? '💾 Simpan Perubahan' : '➕ Tambah')}
          </button>
        </div>
      </div>
    </div>
  )
}