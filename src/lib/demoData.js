/**
 * Data DEMO — dipakai saat belum ada kredensial Supabase.
 * Struktur pohon keluarga 4 generasi (kakek-nenek -> buyut).
 *
 * Model data:
 *  - people : daftar orang
 *  - units  : "unit keluarga" = pasangan (bisa 1 orang bila duda/janda).
 *             units[].childUnitIds -> anak-anak dari pasangan ini.
 *  - Merender pohon = menelusuri unit dari akar (rootUnitId).
 */
export const DEMO_ROOT = 'u1'

export const DEMO_PEOPLE = [
  // ---------- GENERASI 1 : KAKEK & NENEK ----------
  { id:'p1', nama:'H. Soedarmo Wirosoekarto', kota:'Yogyakarta', gender:'L',
    lahir:1928, wafat:true, wafatTahun:2003, pekerjaan:'Petani & pedagang batik',
    catatan:'Pendiri keluarga besar Wirosoekarto. Merintis usaha batik di Bantul sejak 1955.',
    thumb:'/demo/p12_thumb.webp', full:'/demo/p12_full.webp' },
  { id:'p2', nama:'Hj. Siti Rahayu', kota:'Yogyakarta', gender:'P',
    lahir:1931, wafat:true, wafatTahun:2011, pekerjaan:'Ibu rumah tangga',
    catatan:'Dikenal sabar dan pandai memasak. Resep gudegnya diturunkan ke cucu-cucunya.',
    thumb:'/demo/p15_thumb.webp', full:'/demo/p15_full.webp' },

  // ---------- GENERASI 2 : ANAK-ANAK ----------
  { id:'p3', nama:'Ir. Bambang Wirosoekarto', kota:'Semarang', gender:'L',
    lahir:1954, pekerjaan:'Pensiunan BUMN',
    catatan:'Anak pertama. Melanjutkan usaha batik keluarga sebelum pindah ke Semarang.',
    thumb:'/demo/p33_thumb.webp', full:'/demo/p33_full.webp' },
  { id:'p4', nama:'Sri Lestari, S.Pd.', kota:'Semarang', gender:'P',
    lahir:1957, pekerjaan:'Guru SD (pensiun)',
    catatan:'Pencinta taman. Aktif di kegiatan arisan & pengajian kampung.',
    thumb:'/demo/p26_thumb.webp', full:'/demo/p26_full.webp' },

  { id:'p5', nama:'Dwi Asih Wirosoekarto', kota:'Bantul', gender:'P',
    lahir:1958, pekerjaan:'Penjahit',
    catatan:'Tinggal di rumah warisan kakek. Menjaga kebun & makam keluarga.',
    thumb:'/demo/p20_thumb.webp', full:'/demo/p20_full.webp' },
  { id:'p6', nama:'H. Ahmad Sutrisno', kota:'Bantul', gender:'L',
    lahir:1955, pekerjaan:'Pedagang sembako',
    catatan:'Punya warung sembako di depan pasar. Ramah ke semua orang.',
    thumb:'/demo/p5_thumb.webp', full:'/demo/p5_full.webp' },

  { id:'p7', nama:'Tri Handoko Wirosoekarto', kota:'Surabaya', gender:'L',
    lahir:1961, wafat:true, wafatTahun:2020, pekerjaan:'Kontraktor',
    catatan:'Merantau ke Surabaya sejak muda. Rajin pulang setiap lebaran.',
    thumb:'/demo/p47_thumb.webp', full:'/demo/p47_full.webp' },
  { id:'p8', nama:'Ratna Sari Dewi', kota:'Surabaya', gender:'P',
    lahir:1964, pekerjaan:'Wirausaha catering',
    catatan:'Melanjutkan katering suami setelah beliau wafat.',
    thumb:'/demo/p31_thumb.webp', full:'/demo/p31_full.webp' },

  { id:'p9', nama:'Catur Wulandari', kota:'Jakarta', gender:'P',
    lahir:1966, pekerjaan:'Perawat RSUD',
    catatan:'Anak bungsu. Sering jadi penghubung keluarga besar lewat grup WhatsApp.',
    thumb:'/demo/p22_thumb.webp', full:'/demo/p22_full.webp' },
  { id:'p10', nama:'Bagus Nugroho', kota:'Jakarta', gender:'L',
    lahir:1963, pekerjaan:'Sopir bus antar kota',
    catatan:'Hobi memancing di hari libur.',
    thumb:'/demo/p8_thumb.webp', full:'/demo/p8_full.webp' },

  // ---------- GENERASI 3 : CUCU ----------
  { id:'p11', nama:'Aditya Wirosoekarto', kota:'Jakarta', gender:'L',
    lahir:1985, pekerjaan:'Software engineer',
    catatan:'Cucu tertua. Yang mengusulkan dibuatkannya silsilah digital ini.',
    thumb:'/demo/p39_thumb.webp', full:'/demo/p39_full.webp' },
  { id:'p12', nama:'Febriani Putri', kota:'Jakarta', gender:'P',
    lahir:1988, pekerjaan:'Dokter gigi',
    catatan:'Buka praktik di dekat rumah.',
    thumb:'/demo/p45_thumb.webp', full:'/demo/p45_full.webp' },
  { id:'p13', nama:'Bunga Wirosoekarto', kota:'Bandung', gender:'P',
    lahir:1987, pekerjaan:'Desainer grafis',
    catatan:'Bekerja remote, sering berkunjung ke Bantul.',
    thumb:'/demo/p51_thumb.webp', full:'/demo/p51_full.webp' },
  { id:'p14', nama:'Candra Wirosoekarto', kota:'Semarang', gender:'L',
    lahir:1990, pekerjaan:'Dosen',
    catatan:'Mengajar di salah satu universitas negeri.',
    thumb:'/demo/p60_thumb.webp', full:'/demo/p60_full.webp' },
  { id:'p15', nama:'Dewi Sutrisno', kota:'Yogyakarta', gender:'P',
    lahir:1986, pekerjaan:'Akuntan',
    catatan:'Membantu pencatatan keuangan warung keluarga.',
    thumb:'/demo/p56_thumb.webp', full:'/demo/p56_full.webp' },
  { id:'p16', nama:'Eko Sutrisno', kota:'Sleman', gender:'L',
    lahir:1989, pekerjaan:'Arsitek',
    catatan:'Merancang renovasi rumah warisan kakek.',
    thumb:'/demo/p68_thumb.webp', full:'/demo/p68_full.webp' },
  { id:'p17', nama:'Fajar Handoko', kota:'Surabaya', gender:'L',
    lahir:1992, pekerjaan:'Wirausaha muda', catatan:'', thumb:'', full:'' },
  { id:'p18', nama:'Gita Handoko', kota:'Surabaya', gender:'P',
    lahir:1995, pekerjaan:'Desainer interior', catatan:'', thumb:'', full:'' },
  { id:'p19', nama:'Hana Nugroho', kota:'Jakarta', gender:'P',
    lahir:1998, pekerjaan:'Mahasiswa pascasarjana', catatan:'', thumb:'', full:'' },

  // ---------- GENERASI 4 : BUYUT ----------
  { id:'p20', nama:'Indra Wirosoekarto', kota:'Jakarta', gender:'L',
    lahir:2012, pekerjaan:'Pelajar', catatan:'Cicit pertama. Generasi keempat.', thumb:'', full:'' },
]

export const DEMO_UNITS = [
  // GENERASI 1
  { id:'u1', partnerIds:['p1','p2'], childUnitIds:['u2','u3','u4','u5'], parentUnitId:null,
    nikah:'Yogyakarta, 1952' },
  // GENERASI 2
  { id:'u2', partnerIds:['p3','p4'], childUnitIds:['u6','u7','u8'], parentUnitId:'u1', nikah:'Semarang, 1982' },
  { id:'u3', partnerIds:['p5','p6'], childUnitIds:['u9','u10'],     parentUnitId:'u1', nikah:'Bantul, 1983' },
  { id:'u4', partnerIds:['p7','p8'], childUnitIds:['u11','u12'],    parentUnitId:'u1', nikah:'Surabaya, 1984' },
  { id:'u5', partnerIds:['p9','p10'], childUnitIds:['u13'],         parentUnitId:'u1', nikah:'Jakarta, 1986' },
  // GENERASI 3
  { id:'u6', partnerIds:['p11','p12'], childUnitIds:['u14'], parentUnitId:'u2', nikah:'Jakarta, 2010' },
  { id:'u7', partnerIds:['p13'], childUnitIds:[], parentUnitId:'u2', nikah:'' },
  { id:'u8', partnerIds:['p14'], childUnitIds:[], parentUnitId:'u2', nikah:'' },
  { id:'u9', partnerIds:['p15'], childUnitIds:[], parentUnitId:'u3', nikah:'' },
  { id:'u10', partnerIds:['p16'], childUnitIds:[], parentUnitId:'u3', nikah:'' },
  { id:'u11', partnerIds:['p17'], childUnitIds:[], parentUnitId:'u4', nikah:'' },
  { id:'u12', partnerIds:['p18'], childUnitIds:[], parentUnitId:'u4', nikah:'' },
  { id:'u13', partnerIds:['p19'], childUnitIds:[], parentUnitId:'u5', nikah:'' },
  // GENERASI 4
  { id:'u14', partnerIds:['p20'], childUnitIds:[], parentUnitId:'u6', nikah:'' },
]

/** Pengguna demo (mode tanpa Supabase) */
export const DEMO_USERS = [
  { email:'admin@keluarga.id', password:'keluarga123', nama:'Aditya Wirosoekarto', role:'admin' },
  { email:'anggota@keluarga.id', password:'keluarga123', nama:'Bunga Wirosoekarto', role:'anggota' },
]