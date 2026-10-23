import Avatar from './Avatar'
import { initials, photoOf, umur, tahunHidup } from '../lib/helpers'

export default function PersonDetail({ person, people, units, onClose, onShowPhoto, onEdit, canEdit, onSelect, onAddChild, onAddSpouse }) {
  const byId = Object.fromEntries(people.map(p => [p.id, p]))
  const unitOf = (pid) => units.find(u => u.partnerIds.includes(pid))
  const myUnit = unitOf(person.id)

  // Pasangan
  const pasangan = myUnit ? myUnit.partnerIds.filter(id => id !== person.id).map(id => byId[id]).filter(Boolean) : []
  // Orang tua = partner di unit induk
  const parentUnit = myUnit?.parentUnitId ? units.find(u => u.id === myUnit.parentUnitId) : null
  const ortu = parentUnit ? parentUnit.partnerIds.map(id => byId[id]).filter(Boolean) : []
  // Anak = partner di semua unit anak
  const anak = []
  ;(myUnit?.childUnitIds || []).forEach(cid => {
    const cu = units.find(u => u.id === cid)
    ;(cu?.partnerIds || []).forEach(id => { if (byId[id]) anak.push(byId[id]) })
  })
  // Saudara
  const saudara = []
  if (parentUnit) {
    parentUnit.childUnitIds.forEach(cid => {
      const cu = units.find(u => u.id === cid)
      if (cu && cu.id !== myUnit.id) cu.partnerIds.forEach(id => { if (byId[id]) saudara.push(byId[id]) })
    })
  }

  const src = photoOf(person, 'thumb')
  const u = umur(person)

  const RelChips = ({ list, kosong }) => (
    list.length === 0
      ? <span style={{ color: 'var(--muted-2)', fontSize: 13 }}>{kosong}</span>
      : <div className="rel-list">
          {list.map(p => (
            <button key={p.id} className="rel-chip" onClick={() => onSelect(p.id)}>
              <Avatar person={p} size={26} />
              <span>{p.nama}</span>
            </button>
          ))}
        </div>
  )

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-head">
          <h3>Detail Anggota Keluarga</h3>
          <button className="close-x" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-body">
          <div className="pd-top">
            {src
              ? <img className="pd-photo" src={src} alt={person.nama} onClick={() => onShowPhoto(person)} />
              : <div className="pd-photo pd-photo-ph">{initials(person.nama)}</div>}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 className="pd-name">{person.nama}</h2>
              <span className={`badge ${person.wafat ? 'badge-wafat' : 'badge-hidup'}`}>
                {person.wafat ? '✦ Telah Wafat' : '● Masih Hidup'}
              </span>
              <div className="pd-rows">
                <div className="pd-row"><span className="k">Kota tinggal</span><span className="v">📍 {person.kota || '—'}</span></div>
                <div className="pd-row"><span className="k">Tahun</span><span className="v">{tahunHidup(person) || '—'}{u ? ` · ${u} th` : ''}</span></div>
                {person.pekerjaan && <div className="pd-row"><span className="k">Pekerjaan</span><span className="v">{person.pekerjaan}</span></div>}
                {myUnit?.nikah && <div className="pd-row"><span className="k">Pernikahan</span><span className="v">{myUnit.nikah}</span></div>}
              </div>
            </div>
          </div>

          {src && (
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '9px 14px' }} onClick={() => onShowPhoto(person)}>
              🔍 Lihat foto resolusi penuh
            </button>
          )}

          {person.catatan && (
            <div className="pd-section">
              <h4>Catatan / Cerita</h4>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: '#374151' }}>{person.catatan}</p>
            </div>
          )}

          <div className="pd-section">
            <h4>Hubungan Keluarga</h4>
            <div style={{ display: 'grid', gap: 14 }}>
              <div><div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Pasangan</div>
                <RelChips list={pasangan} kosong="—" /></div>
              <div><div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Orang Tua</div>
                <RelChips list={ortu} kosong={myUnit?.parentUnitId ? '—' : 'Leluhur teratas (tidak ada data orang tua)'} /></div>
              <div><div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Anak ({anak.length})</div>
                <RelChips list={anak} kosong="Belum ada data anak" /></div>
              <div><div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Saudara</div>
                <RelChips list={saudara} kosong="—" /></div>
            </div>
          </div>
        </div>
        <div className="modal-foot" style={{ flexWrap: 'wrap' }}>
          {canEdit && (
            <>
              <button className="btn btn-ghost" onClick={() => onAddChild(person)}>➕ Anak</button>
              {pasangan.length === 0 && <button className="btn btn-ghost" onClick={() => onAddSpouse(person)}>💍 Pasangan</button>}
            </>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Tutup</button>
          {canEdit && <button className="btn btn-gold" onClick={() => onEdit(person)}>✏️ Ubah Data</button>}
        </div>
      </div>
    </div>
  )
}