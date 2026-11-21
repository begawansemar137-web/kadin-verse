import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { AuthService } from '@/features/auth/domain/auth-service';
import { SessionProvider, useSession } from '@/features/auth/session-context';
import { createTestAuthService } from '@/features/auth/testing/auth-fixtures';

const MEMBER = { status: 'member', displayName: 'Anggota Demo', isMock: true };

const wrapperFor = (service: AuthService) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider service={service}>{children}</SessionProvider>
  );
  return Wrapper;
};

describe('SessionProvider', () => {
  it('restores on mount: guest when nothing is stored', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(createTestAuthService()) });
    await waitFor(() => expect(result.current.session).toEqual({ status: 'guest' }));
    expect(result.current.canSignIn).toBe(true);
  });

  it('restores a stored member session on mount', async () => {
    const service = createTestAuthService({ signedIn: true });
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.session).toEqual(MEMBER));
  });

  it('signs in and out through the service', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(createTestAuthService()) });
    await waitFor(() => expect(result.current.session.status).toBe('guest'));

    await act(async () => {
      expect(await result.current.signIn()).toBe('ok');
    });
    expect(result.current.session).toEqual(MEMBER);

    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.session).toEqual({ status: 'guest' });
  });

  it('exposes no credentials through the hook', async () => {
    const service = createTestAuthService({ signedIn: true });
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.session.status).toBe('member'));
    expect(JSON.stringify(result.current)).not.toMatch(/fake-(access|refresh)/);
  });

  it('throws a clear error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(async () => {
      await renderHook(() => useSession());
    }).rejects.toThrow('useSession must be used inside SessionProvider');
  });
});
