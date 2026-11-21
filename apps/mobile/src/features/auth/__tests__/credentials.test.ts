import {
  EXPIRY_SKEW_MS,
  isExpired,
  parseStoredSession,
  serializeStoredSession,
  type StoredSession,
} from '@/features/auth/domain/credentials';

const NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

const sample: StoredSession = {
  credentials: { accessToken: 'fake-access-1', refreshToken: 'fake-refresh-1', expiresAt: NOW + 60_000 },
  user: { subject: 'fake-subject-0001', displayName: 'Anggota Demo' },
};

describe('isExpired', () => {
  it('is false well before expiry', () => {
    expect(isExpired(sample.credentials, NOW)).toBe(false);
  });

  it('is true inside the skew window', () => {
    expect(isExpired(sample.credentials, sample.credentials.expiresAt - EXPIRY_SKEW_MS)).toBe(true);
  });

  it('is true after expiry', () => {
    expect(isExpired(sample.credentials, sample.credentials.expiresAt + 1)).toBe(true);
  });
});

describe('stored session format', () => {
  it('round-trips', () => {
    expect(parseStoredSession(serializeStoredSession(sample))).toEqual(sample);
  });

  it('accepts a null refresh token', () => {
    const noRefresh = { ...sample, credentials: { ...sample.credentials, refreshToken: null } };
    expect(parseStoredSession(serializeStoredSession(noRefresh))).toEqual(noRefresh);
  });

  it.each([
    ['nothing stored', null],
    ['not JSON', '{oops'],
    ['JSON null', 'null'],
    ['a bare string', '"fake-access-1"'],
    ['unknown version', JSON.stringify({ ...sample, v: 2 })],
    ['missing version', JSON.stringify(sample)],
    ['missing access token', JSON.stringify({ v: 1, ...sample, credentials: { ...sample.credentials, accessToken: '' } })],
    ['non-numeric expiry', JSON.stringify({ v: 1, ...sample, credentials: { ...sample.credentials, expiresAt: 'soon' } })],
    ['numeric refresh token', JSON.stringify({ v: 1, ...sample, credentials: { ...sample.credentials, refreshToken: 7 } })],
    ['empty display name', JSON.stringify({ v: 1, ...sample, user: { ...sample.user, displayName: '' } })],
    ['missing user', JSON.stringify({ v: 1, credentials: sample.credentials })],
  ])('rejects %s', (_label, raw) => {
    expect(parseStoredSession(raw)).toBeNull();
  });

  it('drops unexpected extra fields', () => {
    const raw = JSON.stringify({ v: 1, ...sample, user: { ...sample.user, nik: '0000' } });
    expect(parseStoredSession(raw)).toEqual(sample);
  });
});
