import { isValidContentId, safeReturnTo } from '@/navigation/deep-link';

describe('isValidContentId', () => {
  it.each(['abc-123', 'A1', 'a'.repeat(64)])('accepts %s', (id) => {
    expect(isValidContentId(id)).toBe(true);
  });

  it.each([undefined, '', 'bad id', '../card', '%00', 'a'.repeat(65), 'x/y', 'id?x=1'])(
    'rejects %s',
    (id) => {
      expect(isValidContentId(id)).toBe(false);
    },
  );
});

describe('safeReturnTo', () => {
  it.each([
    ['/card', '/card'],
    ['/account', '/account'],
    ['/news/abc-1', '/news/abc-1'],
    ['/card?x=1', '/card'],
    ['/card/', '/card'],
    ['/', '/'],
  ])('keeps in-app path %s as %s', (raw, expected) => {
    expect(safeReturnTo(raw)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    'https://evil.example',
    '//evil.example',
    '%2F%2Fevil.example',
    '/news/../card',
    '/news/%2E%2E%2Fcard',
    '/unknown',
    '/sign-in',
    '/card\\evil',
    '/%E0%A4%A',
  ])('falls back to / for %s', (raw) => {
    expect(safeReturnTo(raw)).toBe('/');
  });
});
