import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { GUEST, MOCK_MEMBER, type Session } from './domain/session';

type SessionContextValue = {
  session: Session;
  signInMock: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = { children: ReactNode; initialSession?: Session };

/** In-memory only: nothing is persisted, no tokens exist (AGENTS.md §6). */
export const SessionProvider = ({ children, initialSession = GUEST }: SessionProviderProps) => {
  const [session, setSession] = useState<Session>(initialSession);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      signInMock: () => setSession(MOCK_MEMBER),
      signOut: () => setSession(GUEST),
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
};
