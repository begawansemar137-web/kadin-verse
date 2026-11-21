import { createFakeAuthProvider, FAKE_USER } from '@/features/auth/data/fake-auth-provider';

const NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

describe('fake auth provider', () => {
  it('is marked as mock', () => {
    expect(createFakeAuthProvider().isMock).toBe(true);
  });

  it('signs in with synthetic credentials and the demo user', async () => {
    const provider = createFakeAuthProvider({ now: () => NOW, ttlMs: 60_000 });
    const result = await provider.signIn();
    expect(result).toEqual({
      ok: true,
      user: FAKE_USER,
      credentials: { accessToken: 'fake-access-1', refreshToken: 'fake-refresh-1', expiresAt: NOW + 60_000 },
    });
    expect(provider.calls.signIn).toBe(1);
  });

  it.each(['cancelled', 'network', 'rejected'] as const)('returns the configured %s failure', async (reason) => {
    const provider = createFakeAuthProvider({ signIn: reason });
    expect(await provider.signIn()).toEqual({ ok: false, reason });
  });

  it('refreshes a token it issued with a new pair', async () => {
    const provider = createFakeAuthProvider({ now: () => NOW });
    await provider.signIn();
    const result = await provider.refresh('fake-refresh-1');
    expect(result).toEqual({
      ok: true,
      credentials: { accessToken: 'fake-access-2', refreshToken: 'fake-refresh-2', expiresAt: expect.any(Number) },
    });
  });

  it('rejects a refresh token that is not a fake token', async () => {
    expect(await createFakeAuthProvider().refresh('real-looking-token')).toEqual({ ok: false, reason: 'rejected' });
  });

  it('rejects a refresh token after it was revoked', async () => {
    const provider = createFakeAuthProvider();
    const signIn = await provider.signIn();
    if (!signIn.ok) throw new Error('expected sign-in to succeed');
    await provider.revoke(signIn.credentials);
    expect(await provider.refresh('fake-refresh-1')).toEqual({ ok: false, reason: 'rejected' });
    expect(provider.calls.revoke).toBe(1);
  });

  it('can be reconfigured between calls', async () => {
    const provider = createFakeAuthProvider();
    provider.configure({ refresh: 'network' });
    expect(await provider.refresh('fake-refresh-9')).toEqual({ ok: false, reason: 'network' });
  });
});
