import type { Session } from '@/features/auth/domain/session';
import { canAccess, isProtectedPath } from '@/navigation/access';

const guest: Session = { status: 'guest' };
const member: Session = { status: 'member', displayName: 'Anggota Demo', isMock: true };

describe('isProtectedPath', () => {
  it.each(['/card', '/card/', '/card/anything'])('treats %s as protected', (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(['/', '/news', '/services', '/account', '/cardigan', '/news/card'])(
    'treats %s as public',
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});

describe('canAccess', () => {
  it('lets guests reach public routes (BR-001)', () => {
    expect(canAccess('/', guest)).toBe(true);
    expect(canAccess('/news', guest)).toBe(true);
  });

  it('blocks guests from protected routes (BR-002)', () => {
    expect(canAccess('/card', guest)).toBe(false);
  });

  it('lets members reach protected routes', () => {
    expect(canAccess('/card', member)).toBe(true);
  });

  it('does not let a still-restoring session through (screens show loading instead)', () => {
    expect(canAccess('/card', { status: 'restoring' })).toBe(false);
  });
});
