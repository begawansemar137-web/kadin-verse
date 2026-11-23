const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] as const;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Publication date in WIB with Indonesian short months. PLACEHOLDER format pending UX approval. */
export const formatPublishedDate = (iso: string): string => {
  const wib = new Date(Date.parse(iso) + WIB_OFFSET_MS);
  return `${wib.getUTCDate()} ${MONTHS[wib.getUTCMonth()]} ${wib.getUTCFullYear()}`;
};
