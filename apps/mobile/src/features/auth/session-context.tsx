import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { createDefaultAuthService } from './default-auth-service';
import type { AuthService, SignInOutcome } from './domain/auth-service';
import type { Session } from './domain/session';

type SessionContextValue = {
  session: Session;
  canSignIn: boolean;
  signIn: () => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = { children: ReactNode; service?: AuthService };

/** Binds AuthService to React. Only the token-free Session crosses this boundary (ADR-003 §2). */
export const SessionProvider = ({ children, service: injected }: SessionProviderProps) => {
  const [service] = useState(() => injected ?? createDefaultAuthService());
  const session = useSyncExternalStore(service.subscribe, service.getSession);

  useEffect(() => {
    void service.restore();
  }, [service]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, canSignIn: service.canSignIn, signIn: service.signIn, signOut: service.signOut }),
    [session, service],
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
