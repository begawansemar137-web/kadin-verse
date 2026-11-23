import type { CmsArticle } from './fake-cms';

/**
 * Synthetic content for dev/preview builds (ADR-013 §8). Not KADIN news; not derived from the legacy APK.
 * Image hosts use the reserved `.invalid` TLD, so images always fail and show the fallback (AC-005-06).
 */
const TOPICS = [
  'Forum UMKM Daerah',
  'Pelatihan Ekspor Pemula',
  'Diskusi Kebijakan Investasi',
  'Temu Bisnis Regional',
  'Program Kemitraan Industri',
  'Webinar Digitalisasi Usaha',
  'Rapat Kerja Komite',
  'Kunjungan Delegasi Dagang',
  'Seminar Energi Terbarukan',
  'Sosialisasi Perizinan',
  'Pameran Produk Lokal',
  'Lokakarya Pembiayaan',
];

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}T03:00:00.000Z`;

const published: CmsArticle[] = TOPICS.map((topic, i) => ({
  id: id(i + 1),
  title: `[Contoh] ${topic}`,
  summary: `Ringkasan contoh untuk ${topic.toLowerCase()}.`,
  body: `Ini adalah artikel contoh tentang ${topic.toLowerCase()}.\n\nKonten ini sintetis dan hanya untuk pengujian.`,
  status: 'published',
  publishedAt: day(30 - i),
  image:
    i % 3 === 0 ? { url: `https://media.example.invalid/news/${i + 1}.jpg`, alt: `Ilustrasi contoh ${topic}` } : null,
}));

const hidden = (n: number, status: CmsArticle['status'], publishedAt: string | null): CmsArticle => ({
  id: id(n),
  title: `[Contoh] Konten tidak publik ${n}`,
  summary: 'Tidak boleh tampil di aplikasi.',
  body: 'Tidak boleh tampil di aplikasi.',
  status,
  publishedAt,
  image: null,
});

export const SAMPLE_IDS = {
  firstPublished: id(1),
  draft: id(101),
  inReview: id(102),
  archived: id(103),
  scheduled: id(104),
} as const;

export const SAMPLE_ARTICLES: CmsArticle[] = [
  ...published,
  hidden(101, 'draft', null),
  hidden(102, 'in_review', null),
  hidden(103, 'archived', day(1)),
  hidden(104, 'published', '2099-01-01T00:00:00.000Z'),
];
