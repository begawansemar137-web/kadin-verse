/** Mock-only session for B-001. Real identity is B-002 and blocked on ADR-003 / D-03. */
export type Session =
  | { status: 'guest' }
  | { status: 'member'; displayName: string; isMock: true };

export const GUEST: Session = { status: 'guest' };

export const MOCK_MEMBER: Session = {
  status: 'member',
  displayName: 'Anggota Demo',
  isMock: true,
};
