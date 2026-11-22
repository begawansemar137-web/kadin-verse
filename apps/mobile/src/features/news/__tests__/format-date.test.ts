import { formatPublishedDate } from '@/features/news/domain/format-date';

describe('formatPublishedDate (WIB, Indonesian short month)', () => {
  it('formats a UTC instant as its WIB calendar date', () => {
    expect(formatPublishedDate('2026-11-01T03:00:00.000Z')).toBe('1 Nov 2026');
  });

  it('rolls over to the next WIB day after 17:00 UTC', () => {
    expect(formatPublishedDate('2026-08-16T17:30:00.000Z')).toBe('17 Agu 2026');
  });

  it('uses Indonesian month abbreviations', () => {
    expect(formatPublishedDate('2026-05-10T00:00:00.000Z')).toBe('10 Mei 2026');
    expect(formatPublishedDate('2026-12-10T00:00:00.000Z')).toBe('10 Des 2026');
  });
});
