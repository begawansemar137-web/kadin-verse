import * as SecureStore from 'expo-secure-store';

import { SESSION_KEY } from '@/features/auth/data/secure-credential-store';
import { createDefaultAuthService } from '@/features/auth/default-auth-service';

describe('default auth service wiring', () => {
  it('uses the fake provider and secure storage when demo auth is on', async () => {
    const service = createDefaultAuthService({ mockAuth: true });
    expect(service.canSignIn).toBe(true);
    await service.restore();
    expect(await service.signIn()).toBe('ok');
    expect(service.getSession()).toMatchObject({ status: 'member', isMock: true });
    expect(await SecureStore.getItemAsync(SESSION_KEY)).not.toBeNull();
  });

  it('has no provider when demo auth is off', async () => {
    const service = createDefaultAuthService({ mockAuth: false });
    expect(service.canSignIn).toBe(false);
    await service.restore();
    expect(await service.signIn()).toBe('unavailable');
  });
});
