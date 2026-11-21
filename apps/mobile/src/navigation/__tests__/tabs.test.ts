import { TABS } from '@/navigation/tabs';

it('defines the proposed four tabs in order with Indonesian labels (BR-005: UX to confirm)', () => {
  expect(TABS.map((t) => [t.name, t.label])).toEqual([
    ['index', 'Beranda'],
    ['news', 'Berita'],
    ['services', 'Layanan'],
    ['account', 'Akun'],
  ]);
});
