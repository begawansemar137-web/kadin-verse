import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';

import { MOCK_MEMBER } from '@/features/auth/domain/session';
import { SessionProvider, useSession } from '@/features/auth/session-context';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

describe('SessionProvider (mock)', () => {
  it('starts as guest', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper });
    expect(result.current.session).toEqual({ status: 'guest' });
  });

  it('signs in as the mock member and signs out again', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.signInMock();
    });
    expect(result.current.session).toEqual(MOCK_MEMBER);

    await act(async () => {
      result.current.signOut();
    });
    expect(result.current.session).toEqual({ status: 'guest' });
  });

  it('honours initialSession', async () => {
    const { result } = await renderHook(() => useSession(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SessionProvider initialSession={MOCK_MEMBER}>{children}</SessionProvider>
      ),
    });
    expect(result.current.session).toEqual(MOCK_MEMBER);
  });

  it('throws a clear error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(async () => {
      await renderHook(() => useSession());
    }).rejects.toThrow('useSession must be used inside SessionProvider');
  });
});
