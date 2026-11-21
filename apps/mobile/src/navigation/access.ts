import type { Session } from '@/features/auth/domain/session';

/** Client-side UX guard only. Authorization is enforced by the API (SAD §6). */
export const PROTECTED_PATHS = ['/card'] as const;

export const isProtectedPath = (path: string): boolean =>
  PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export const canAccess = (path: string, session: Session): boolean =>
  !isProtectedPath(path) || session.status === 'member';
