/** UI-facing session. Holds no credentials (ADR-003 §2); AuthService owns tokens. */
export type Session =
  | { status: 'restoring' }
  | { status: 'guest'; notice?: 'expired' }
  | { status: 'member'; displayName: string; isMock: boolean };
