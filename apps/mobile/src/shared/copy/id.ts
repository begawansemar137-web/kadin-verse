/** Indonesian UI copy. PROPOSED, so UX/editorial approval is required (BR-005). */
export const copy = {
  common: {
    back: 'Kembali',
    backHome: 'Kembali ke Beranda',
    retry: 'Coba lagi',
    loading: 'Memuat',
    offline: 'Anda sedang offline. Periksa koneksi lalu coba lagi.',
    mockBadge: 'MOCK · data contoh',
    mockBadgeA11y: 'Data contoh, bukan data resmi',
  },
  tabs: { home: 'Beranda', news: 'Berita', services: 'Layanan', account: 'Akun' },
  home: {
    heading: 'Selamat datang',
    greetingGuest: 'Jelajahi berita dan layanan KADIN.',
    greetingMember: (name: string) => `Halo, ${name}`,
    tileNews: 'Berita terbaru',
    tileServices: 'Katalog layanan',
    tileCard: 'Kartu Anggota',
    lockedHint: 'Perlu masuk sebagai anggota',
  },
  news: {
    heading: 'Berita & Informasi',
    empty: 'Belum ada berita yang diterbitkan.',
    detailTitle: 'Detail Berita',
    detailPlaceholder: 'Isi berita akan tersedia setelah modul Berita aktif.',
    notFound: 'Konten tidak ditemukan.',
  },
  services: { heading: 'Katalog Layanan', empty: 'Belum ada layanan yang tersedia.' },
  account: {
    heading: 'Akun Saya',
    guest: 'Anda belum masuk.',
    signIn: 'Masuk',
    signOut: 'Keluar',
    openCard: 'Lihat Kartu Anggota',
  },
  card: {
    title: 'Kartu Anggota',
    heading: 'Kartu Anggota',
    placeholder: 'Pratinjau kartu. Status keanggotaan belum terverifikasi.',
  },
  signIn: {
    title: 'Masuk',
    heading: 'Masuk ke akun',
    explainer: 'Metode masuk resmi belum ditetapkan. Gunakan akun demo untuk mencoba aplikasi.',
    mockButton: 'Masuk sebagai anggota demo',
  },
  notFound: { heading: 'Halaman tidak ditemukan' },
} as const;
