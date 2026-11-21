import { resolveMockAuth } from '@/shared/config/flags';

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
