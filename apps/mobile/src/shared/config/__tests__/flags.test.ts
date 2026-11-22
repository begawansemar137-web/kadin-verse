import { resolveDemoFlag, resolveMockAuth } from '@/shared/config/flags';

describe('resolveMockAuth', () => {
  it('is on in development builds', () => {
    expect(resolveMockAuth({ isDev: true, env: undefined })).toBe(true);
  });

  it('is off in release builds unless explicitly opted in', () => {
    expect(resolveMockAuth({ isDev: false, env: undefined })).toBe(false);
    expect(resolveMockAuth({ isDev: false, env: '' })).toBe(false);
    expect(resolveMockAuth({ isDev: false, env: '1' })).toBe(false);
    expect(resolveMockAuth({ isDev: false, env: 'TRUE ' })).toBe(false);
  });

  it('can be opted in for a demo build with EXPO_PUBLIC_MOCK_AUTH=true', () => {
    expect(resolveMockAuth({ isDev: false, env: 'true' })).toBe(true);
  });
});

describe('resolveDemoFlag (mockContent)', () => {
  it('follows the same rule as mock auth: dev, or an exact "true" opt-in', () => {
    expect(resolveDemoFlag({ isDev: true, env: undefined })).toBe(true);
    expect(resolveDemoFlag({ isDev: false, env: 'true' })).toBe(true);
    expect(resolveDemoFlag({ isDev: false, env: '1' })).toBe(false);
    expect(resolveDemoFlag({ isDev: false, env: undefined })).toBe(false);
  });
});
