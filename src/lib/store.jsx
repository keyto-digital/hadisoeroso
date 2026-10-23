import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, DEMO } from './supabase'
import {
  loadDemo, saveDemo, resetDemo, DEMO_ROOT_ID,
  loadSettingsDemo, saveSettingsDemo,
} from './helpers'
import { DEMO_USERS } from './demoData'
import { DEFAULT_SETTINGS, gabungSettings } from './settings'

const LS_SESSION = 'silsilah_demo_session'

/* ============================================================
   PEMETAAN antara bentuk aplikasi (camelCase) dan tabel Supabase
   ============================================================ */
const rowToPerson = (r) => ({
  id: r.id, nama: r.nama, kota: r.kota || '', gender: r.gender || 'L',
  lahir: r.lahir ?? null, wafat: !!r.wafat, wafatTahun: r.wafat_tahun ?? null,
  pekerjaan: r.pekerjaan || '', catatan: r.catatan || '',
  photo_path: r.photo_path || null, photo_thumb_path: r.photo_thumb_path || null,
})
const personToRow = (p) => ({
  nama: p.nama, kota: p.kota || null, gender: p.gender || 'L',
  lahir: p.lahir ?? null, wafat: !!p.wafat, wafat_tahun: p.wafatTahun ?? null,
  pekerjaan: p.pekerjaan || null, catatan: p.catatan || null,
  photo_path: p.photo_path ?? null, photo_thumb_path: p.photo_thumb_path ?? null,
})
const rowToUnit = (r) => ({
  id: r.id, partnerIds: r.partner_ids || [], childUnitIds: r.child_unit_ids || [],
  parentUnitId: r.parent_unit_id || null, nikah: r.nikah || '', isRoot: !!r.is_root,
})
const unitToRow = (u) => ({
  partner_ids: u.partnerIds, child_unit_ids: u.childUnitIds || [],
  parent_unit_id: u.parentUnitId || null, nikah: u.nikah || null, is_root: !!u.isRoot,
})

/* settings: aplikasi memakai camelCase, DB memakai snake_case */
const rowToSettings = (r) => {
  if (!r) return null
  return {
    judul: r.judul, subjudul: r.subjudul, motto: r.motto,
    mottoKredit: r.motto_kredit, logo: r.logo || '',
    tema: r.tema, latar: r.latar, latarFoto: r.latar_foto || '',
    kegiatan: Array.isArray(r.kegiatan) ? r.kegiatan : [],
  }
}
const settingsToRow = (s) => ({
  id: 1, judul: s.judul, subjudul: s.subjudul, motto: s.motto,
  motto_kredit: s.mottoKredit, logo: s.logo || null,
  tema: s.tema, latar: s.latar, latar_foto: s.latarFoto || null,
  kegiatan: s.kegiatan || [], updated_at: new Date().toISOString(),
})

const uid = () => 'x' + Math.random().toString(36).slice(2, 10)
const isPrivileged = (role) => role === 'superadmin' || role === 'admin'
const canManageAccess = (role) => role === 'superadmin'

// Hapus objek foto hanya setelah perubahan database sukses. Mendukung path lama
// (foto penuh masih di bucket fotos/full/) dan path baru (bucket fotos-full).
async function removePhotoObjects(person) {
  if (!person || DEMO || !supabase) return
  const tasks = []
  if (person.photo_thumb_path) tasks.push(supabase.storage.from('fotos').remove([person.photo_thumb_path]))
  if (person.photo_path) {
    // Path foto lama pernah disimpan di bucket fotos; path baru ada di fotos-full.
    // Coba kedua bucket agar penggantian/hapus tetap membersihkan data hasil versi lama.
    tasks.push(supabase.storage.from('fotos-full').remove([person.photo_path]))
    tasks.push(supabase.storage.from('fotos').remove([person.photo_path]))
  }
  const results = await Promise.all(tasks)
  const failed = results.find(r => r.error)
  if (failed) throw new Error('Data tersimpan, tetapi foto lama belum berhasil dihapus: ' + failed.error.message)
}

/* ============================================================
   CONTEXT
   ============================================================ */
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [people, setPeople] = useState([])
  const [units, setUnits] = useState([])
  const [rootId, setRootId] = useState(null)
  const [user, setUser] = useState(null)   // {email, nama, role}
  const [toasts, setToasts] = useState([])
  const [settings, setSettings] = useState(() => structuredClone(DEFAULT_SETTINGS))

  const toast = useCallback((text, kind = '') => {
    const id = uid()
    setToasts(t => [...t, { id, text, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])

  /* ---------- sesi ---------- */
  useEffect(() => {
    let active = true
    ;(async () => {
      if (DEMO) {
        try {
          const raw = localStorage.getItem(LS_SESSION)
          if (raw && active) setUser(JSON.parse(raw))
        } catch { /* abaikan */ }
        // pengaturan tampilan dimuat lebih awal supaya halaman login ikut bertema
        setSettings(gabungSettings(loadSettingsDemo()))
        if (active) setReady(true)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (active && data.session?.user) {
        const u = data.session.user
        setUser({ email: u.email, nama: u.user_metadata?.nama || u.email, role: u.app_metadata?.role || 'anggota' })
      }
      if (active) setReady(true)
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (s?.user) {
          const u = s.user
          setUser({ email: u.email, nama: u.user_metadata?.nama || u.email, role: u.app_metadata?.role || 'anggota' })
        } else setUser(null)
      })
      return () => sub?.subscription?.unsubscribe?.()
    })()
    return () => { active = false }
  }, [])

  /* ---------- muat data ---------- */
  const loadAll = useCallback(async () => {
    if (DEMO) {
      const { people: p, units: u } = loadDemo()
      setPeople(p); setUnits(u)
      setRootId(u.find(x => x.isRoot)?.id || u.find(x => !x.parentUnitId)?.id || u[0]?.id || DEMO_ROOT_ID)
      setSettings(gabungSettings(loadSettingsDemo()))
      return
    }
    // Pengunjung anonim hanya mengambil kolom yang dipakai kartu publik.
    // Pengguna login dapat mengambil data lengkap sesuai kebijakan RLS Supabase.
    const peopleRequest = user
      ? supabase.from('people').select('*').order('created_at', { ascending: true })
      : supabase.from('people').select('id,nama,kota,wafat,photo_thumb_path')

    // Pengunjung anonim hanya membutuhkan relasi untuk menggambar pohon.
    // Jangan mengambil kolom nikah atau kolom lain yang tidak diperlukan.
    const unitsRequest = user
      ? supabase.from('units').select('*')
      : supabase.from('units').select('id,partner_ids,child_unit_ids,parent_unit_id,is_root')

    const [{ data: pr, error: peopleError }, { data: ur, error: unitsError }] = await Promise.all([
      peopleRequest,
      unitsRequest,
    ])
    if (peopleError) throw new Error('Gagal memuat anggota keluarga: ' + peopleError.message)
    if (unitsError) throw new Error('Gagal memuat hubungan keluarga: ' + unitsError.message)
    const ppl = (pr || []).map(rowToPerson)
    const uns = (ur || []).map(rowToUnit)
    setPeople(ppl); setUnits(uns)
    setRootId(uns.find(x => x.isRoot)?.id || uns.find(x => !x.parentUnitId)?.id || uns[0]?.id || null)
    // Kegiatan keluarga tidak ditampilkan kepada pengunjung publik.
    // Kolom pengaturan yang diminta juga dibatasi, bukan select('*').
    const settingsRequest = user
      ? supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      : supabase.from('settings')
        .select('id,judul,subjudul,motto,motto_kredit,logo,tema,latar,latar_foto,kegiatan')
        .eq('id', 1).maybeSingle()
    const { data: st, error: settingsError } = await settingsRequest
    if (settingsError) throw new Error('Gagal memuat pengaturan: ' + settingsError.message)
    setSettings(gabungSettings(rowToSettings(st)))
  }, [user])

  useEffect(() => { if (ready) loadAll() }, [ready, user, loadAll])

  /* ---------- pengaturan tampilan ---------- */
  const updateSettings = useCallback(async (patch) => {
    const isSuperadmin = user?.role === 'superadmin'
    // Admin biasa hanya boleh mengubah kegiatan; pengaturan tampilan dipertahankan
    // dari nilai tersimpan agar tidak dapat diubah lewat UI yang dimodifikasi.
    const safePatch = isSuperadmin
      ? patch
      : { kegiatan: patch?.kegiatan ?? settings.kegiatan }
    const gabung = gabungSettings({ ...settings, ...safePatch })
    if (!isSuperadmin && !DEMO && patch?.kegiatan === undefined) {
      throw new Error('Hanya superadmin yang boleh mengubah pengaturan tampilan.')
    }
    if (!isSuperadmin && !DEMO) {
      const { error } = await supabase.from('settings')
        .update({ kegiatan: gabung.kegiatan, updated_at: new Date().toISOString() }).eq('id', 1)
      if (error) throw new Error(error.message)
      setSettings(gabung)
      return gabung
    }
    setSettings(gabung)
    if (DEMO) {
      saveSettingsDemo(gabung)
      return gabung
    }
    const { error } = await supabase.from('settings')
      .upsert(settingsToRow(gabung), { onConflict: 'id' })
    if (error) throw new Error(error.message)
    return gabung
  }, [settings, user])

  const resetSettings = useCallback(async () => {
    if (user?.role !== 'superadmin') throw new Error('Hanya superadmin yang boleh mereset pengaturan.')
    const d = structuredClone(DEFAULT_SETTINGS)
    setSettings(d)
    if (DEMO) { saveSettingsDemo(d); return }
    const { error } = await supabase.from('settings').upsert(settingsToRow(d), { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }, [user])

  /* ---------- auth ---------- */
  const signIn = useCallback(async (email, password) => {
    if (DEMO) {
      const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password)
      if (!found) throw new Error('Email atau kata sandi salah. (Mode demo — lihat contoh akun di bawah)')
      const u = { email: found.email, nama: found.nama, role: found.role }
      localStorage.setItem(LS_SESSION, JSON.stringify(u))
      setUser(u)
      return u
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah.' : error.message)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    if (DEMO) { localStorage.removeItem(LS_SESSION); setUser(null); return }
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  /* ---------- kelola akses anggota (khusus Supabase) ---------- */
  // Catatan penting: pendaftaran akun resmi SEBAIKNYA lewat salah satu cara berikut,
  // karena kunci admin tingkat tinggi tidak boleh disimpan di aplikasi web:
  //   (a) Undangan email dari Supabase Dashboard → Authentication → Users → Invite
  //   (b) Fungsi server (Supabase Edge Function) yang menyimpan kunci admin
  // Di sini kita sediakan daftar akses + pendaftaran cepat memakai Supabase Auth
  // publik (bila "Enable sign-ups" aktif di dashboard).
  const listUsers = useCallback(async () => {
    if (DEMO) return DEMO_USERS.map(u => ({ email: u.email, nama: u.nama, role: u.role }))
    // daftar anggota keluarga + perannya disimpan di tabel `users` (lihat schema_akses.sql)
    const { data, error } = await supabase.from('users').select('*').order('created_at')
    if (error) return []
    return (data || []).map(u => ({ id: u.id, email: u.email, nama: u.nama, role: u.role }))
  }, [])

  const inviteUser = useCallback(async ({ email, nama, role = 'anggota', password }) => {
    if (DEMO) throw new Error('Pembuatan akun resmi hanya tersedia saat terhubung ke Supabase.')
    if (!['admin', 'anggota'].includes(role)) throw new Error('Peran tidak valid.')
    // Semua akun baru dibuat oleh Edge Function. Service-role key tidak pernah
    // diletakkan di browser; server memverifikasi bahwa pemanggil adalah superadmin.
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email: email.trim().toLowerCase(), nama, role, password },
    })
    if (error) throw new Error(error.message || 'Gagal membuat akun.')
    if (!data?.ok) throw new Error(data?.error || 'Gagal membuat akun.')
    return data.user
  }, [])

  const removeUser = useCallback(async ({ id, email }) => {
    if (DEMO) throw new Error('Penghapusan akun resmi hanya tersedia saat terhubung ke Supabase.')
    if (!id && !email) throw new Error('ID atau email akun wajib tersedia.')
    const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { id, email } })
    if (error) throw new Error(error.message || 'Gagal menghapus akun.')
    if (!data?.ok) throw new Error(data?.error || 'Gagal menghapus akun.')
    return true
  }, [])

  /* ---------- simpan foto ke Storage ---------- */
  async function uploadPhoto(webp) {
    if (!webp || !supabase) return {}
    const base = `${Date.now()}-${uid()}`

    // Pastikan isi file benar-benar WebP; jangan hanya mengganti ekstensi/MIME.
    const toWebPBlob = async (dataUrl) => {
      const source = await (await fetch(dataUrl)).blob()
      if (source.type === 'image/webp') return source

      const objectUrl = URL.createObjectURL(source)
      try {
        const img = new Image()
        img.src = objectUrl
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Browser tidak mendukung konversi foto.')
        ctx.drawImage(img, 0, 0)
        const converted = await new Promise((resolve, reject) => {
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Konversi WebP gagal.')), 'image/webp', 0.86)
        })
        if (converted.type !== 'image/webp') throw new Error('Browser tidak menghasilkan format WebP.')
        return converted
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    const up = async (bucket, path, dataUrl) => {
      if (!dataUrl) return null
      const blob = await toWebPBlob(dataUrl)
      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        contentType: 'image/webp', upsert: true,
      })
      if (error) throw new Error(`Gagal unggah foto (${bucket}): ` + error.message)
      return path
    }
    // Thumbnail public untuk kartu silsilah; foto resolusi tinggi privat.
    const [photo_path, photo_thumb_path] = await Promise.all([
      up('fotos-full', `full/${base}.webp`, webp.fullDataUrl),
      up('fotos', `thumb/${base}.webp`, webp.thumbDataUrl),
    ])
    return { photo_path, photo_thumb_path }
  }

  /* ---------- galeri kenangan kegiatan ---------- */
  const uploadKegiatanPhoto = useCallback(async (kegiatanId, file) => {
    if (DEMO || !supabase) throw new Error('Upload galeri membutuhkan Supabase lokal yang terhubung; mode demo tidak menyimpan foto ke bucket.')
    if (!kegiatanId) throw new Error('ID kegiatan belum tersedia.')
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Pilih file gambar yang valid.')
    const { fileToWebp } = await import('./image')
    const converted = await fileToWebp(file)
    if (!converted.thumb?.size || !converted.full?.size) throw new Error('Browser tidak berhasil mengonversi gambar ke WebP. Coba gambar lain atau browser yang lebih baru.')
    const base = `${Date.now()}-${uid()}`
    const thumbPath = `kegiatan/${kegiatanId}/thumb/${base}.webp`
    const fullPath = `kegiatan/${kegiatanId}/full/${base}.webp`
    const bucket = supabase.storage.from('kegiatan-foto')
    const [thumbUpload, fullUpload] = await Promise.all([
      bucket.upload(thumbPath, converted.thumb, { contentType: 'image/webp', upsert: false }),
      bucket.upload(fullPath, converted.full, { contentType: 'image/webp', upsert: false }),
    ])
    if (thumbUpload.error || fullUpload.error) {
      await bucket.remove([...(thumbUpload.error ? [] : [thumbPath]), ...(fullUpload.error ? [] : [fullPath])]).catch(() => {})
      throw new Error('Gagal mengunggah foto kegiatan: ' + (thumbUpload.error || fullUpload.error).message)
    }
    return {
      id: base, thumbPath, fullPath,
      uploadedAt: new Date().toISOString(),
      width: converted.width, height: converted.height,
      bytes: converted.full.size,
    }
  }, [])

  const getKegiatanPhotoUrl = useCallback(async (path, expiresIn = 3600) => {
    if (!path) return ''
    if (String(path).startsWith('data:') || /^https?:\/\//i.test(path)) return path
    if (DEMO || !supabase) return ''
    const { data, error } = await supabase.storage.from('kegiatan-foto').createSignedUrl(path, expiresIn)
    if (error) throw new Error('Tidak dapat membuka foto galeri: ' + error.message)
    return data?.signedUrl || ''
  }, [])

  const deleteKegiatanPhoto = useCallback(async (kegiatanId, photo) => {
    if (!['admin', 'superadmin'].includes(user?.role)) {
      throw new Error('Hanya admin dan superadmin yang boleh menghapus foto kegiatan.')
    }
    if (DEMO || !supabase) throw new Error('Penghapusan foto membutuhkan Supabase lokal yang terhubung.')
    if (!kegiatanId || !photo || !photo.thumbPath || !photo.fullPath) {
      throw new Error('Data foto tidak lengkap; file tidak dihapus untuk mencegah salah hapus.')
    }
    const paths = [...new Set([photo.thumbPath, photo.fullPath])]
    const { error } = await supabase.storage.from('kegiatan-foto').remove(paths)
    if (error) throw new Error('Gagal menghapus foto dari bucket: ' + error.message)
    return true
  }, [user?.role])

  /* ---------- CRUD ---------- */
  const addPerson = useCallback(async (form, rel = {}) => {
    const { name: refId, type: relType } = rel   // type: 'anak' | 'pasangan' | 'root'
    if (DEMO) {
      const np = {
        id: uid(), nama: form.nama, kota: form.kota, gender: form.gender,
        lahir: form.lahir, wafat: form.wafat, wafatTahun: form.wafatTahun,
        pekerjaan: form.pekerjaan, catatan: form.catatan,
        thumb: form.webp?.thumbDataUrl || '', full: form.webp?.fullDataUrl || '',
      }
      let nu = { id: uid(), partnerIds: [np.id], childUnitIds: [], parentUnitId: null, nikah: '', isRoot: false }
      const nextPeople = [...people, np]
      let nextUnits = units.map(u => ({ ...u, childUnitIds: [...u.childUnitIds] }))

      if (relType === 'anak' && refId) {
        const parent = nextUnits.find(u => u.id === refId)
        if (parent) { nu.parentUnitId = parent.id; parent.childUnitIds.push(nu.id) }
      } else if (relType === 'pasangan' && refId) {
        const u = nextUnits.find(x => x.id === refId)
        if (u && u.partnerIds.length < 2) { u.partnerIds.push(np.id); nu = null }
        else if (u) throw new Error('Orang tersebut sudah memiliki pasangan.')
      } else {
        nu.isRoot = nextUnits.length === 0
      }
      if (nu) nextUnits.push(nu)
      setPeople(nextPeople); setUnits(nextUnits); saveDemo(nextPeople, nextUnits)
      toast('Anggota baru ditambahkan', 'ok')
      return np
    }

    // ---- Supabase ----
    const { data: pr, error: e1 } = await supabase.from('people').insert(personToRow(form)).select().single()
    if (e1) throw new Error(e1.message)
    let photoPaths = {}
    if (form.webp) {
      photoPaths = await uploadPhoto(form.webp)
      const { error: photoUpdateError } = await supabase.from('people').update(photoPaths).eq('id', pr.id)
      if (photoUpdateError) { await removePhotoObjects({ ...photoPaths }); throw new Error(photoUpdateError.message) }
    }
    const newPerson = { ...rowToPerson(pr), ...photoPaths }

    let newUnit = { partnerIds: [pr.id], childUnitIds: [], parentUnitId: null, isRoot: units.length === 0, nikah: '' }
    let linked = null
    if (relType === 'pasangan' && refId) {
      const { data: u } = await supabase.from('units').select('*').contains('partner_ids', [refId]).maybeSingle()
      if (u && (u.partner_ids || []).length < 2) {
        await supabase.from('units').update({ partner_ids: [...u.partner_ids, pr.id] }).eq('id', u.id)
        linked = u.id
      } else if (u) throw new Error('Orang tersebut sudah memiliki pasangan.')
    } else if (relType === 'anak' && refId) {
      newUnit.parentUnitId = refId
    }
    if (!linked) {
      const { data: nu } = await supabase.from('units').insert(unitToRow(newUnit)).select().single()
      if (nu && relType === 'anak' && refId) {
        const { data: parent } = await supabase.from('units').select('*').eq('id', refId).maybeSingle()
        if (parent) await supabase.from('units').update({ child_unit_ids: [...(parent.child_unit_ids || []), nu.id] }).eq('id', refId)
      }
    }
    await loadAll()
    toast('Anggota baru ditambahkan', 'ok')
    return newPerson
  }, [people, units, loadAll, toast])

  const updatePerson = useCallback(async (id, form) => {
    if (DEMO) {
      const nextPeople = people.map(p => p.id === id ? {
        ...p, nama: form.nama, kota: form.kota, gender: form.gender, lahir: form.lahir,
        wafat: form.wafat, wafatTahun: form.wafatTahun, pekerjaan: form.pekerjaan, catatan: form.catatan,
        ...(form.webp ? { thumb: form.webp.thumbDataUrl, full: form.webp.fullDataUrl } : {}),
      } : p)
      setPeople(nextPeople); saveDemo(nextPeople, units)
      toast('Data diperbarui', 'ok')
      return
    }
    const oldPerson = people.find(p => p.id === id)
    let newPhotoPaths = null
    // personToRow(form) tidak membawa path foto dari form; pertahankan path lama
    // jika pengguna hanya mengubah biodata tanpa memilih foto baru.
    let patch = {
      ...personToRow(form),
      photo_path: oldPerson?.photo_path ?? null,
      photo_thumb_path: oldPerson?.photo_thumb_path ?? null,
    }
    if (form.webp) {
      newPhotoPaths = await uploadPhoto(form.webp)
      patch = { ...patch, ...newPhotoPaths }
    }
    const { error } = await supabase.from('people').update(patch).eq('id', id)
    if (error) {
      if (newPhotoPaths) await removePhotoObjects(newPhotoPaths).catch(() => {})
      throw new Error(error.message)
    }
    // Jangan hapus foto lama sebelum DB berhasil menunjuk ke foto baru.
    if (newPhotoPaths && oldPerson) {
      try { await removePhotoObjects(oldPerson) }
      catch (cleanupError) { toast(cleanupError.message, ''); }
    }
    await loadAll()
    toast('Data diperbarui', 'ok')
  }, [people, units, loadAll, toast])

  const deletePerson = useCallback(async (id) => {
    if (DEMO) {
      const nextPeople = people.filter(p => p.id !== id)
      const nextUnits = units
        .map(u => ({
          ...u,
          partnerIds: u.partnerIds.filter(x => x !== id),
          childUnitIds: [...u.childUnitIds],
        }))
        .filter(u => u.partnerIds.length > 0)
      // lepas tautan ke unit yang sudah kosong
      const alive = new Set(nextUnits.map(u => u.id))
      nextUnits.forEach(u => { u.childUnitIds = u.childUnitIds.filter(c => alive.has(c)) })
      setPeople(nextPeople); setUnits(nextUnits); saveDemo(nextPeople, nextUnits)
      toast('Anggota dihapus', '')
      return
    }
    const oldPerson = people.find(p => p.id === id)
    const { error } = await supabase.from('people').delete().eq('id', id)
    if (error) throw new Error(error.message)
    if (oldPerson) {
      try { await removePhotoObjects(oldPerson) }
      catch (cleanupError) { toast(cleanupError.message, '') }
    }
    await loadAll()
    toast('Anggota dihapus', '')
  }, [people, units, loadAll, toast])

  const resetData = useCallback(async () => {
    resetDemo()
    await loadAll()
    toast('Data demo dikembalikan ke awal', 'ok')
  }, [loadAll, toast])

  const value = useMemo(() => ({
    mode: DEMO ? 'demo' : 'supabase',
    ready, people, units, rootId, user, settings,
    canEdit: isPrivileged(user?.role),
    canManageAccess: canManageAccess(user?.role),
    changePassword: async (password) => {
      if (DEMO) throw new Error('Ubah kata sandi tersedia pada akun Supabase, bukan akun demo.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      return true;
    },
    signIn, signOut, addPerson, updatePerson, deletePerson, resetData, loadAll, toast, toasts,
    updateSettings, resetSettings, inviteUser, listUsers, removeUser, uploadKegiatanPhoto, getKegiatanPhotoUrl, deleteKegiatanPhoto,
  }), [ready, people, units, rootId, user, settings, signIn, signOut, addPerson, updatePerson, deletePerson, resetData, loadAll, toast, toasts, updateSettings, resetSettings, inviteUser, listUsers, removeUser, uploadKegiatanPhoto, getKegiatanPhotoUrl, deleteKegiatanPhoto])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}