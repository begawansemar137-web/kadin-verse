import * as SecureStore from 'expo-secure-store';

import { createMemoryCredentialStore } from '@/features/auth/data/memory-credential-store';
import { createSecureCredentialStore, SESSION_KEY } from '@/features/auth/data/secure-credential-store';

describe('memory credential store', () => {
  it('saves, loads and clears', async () => {
    const store = createMemoryCredentialStore();
    expect(await store.load()).toBeNull();
    await store.save('value');
    expect(await store.load()).toBe('value');
    await store.clear();
    expect(await store.load()).toBeNull();
  });

  it('can start seeded', async () => {
    expect(await createMemoryCredentialStore('seed').load()).toBe('seed');
  });
});

describe('secure credential store', () => {
  const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

  it('round-trips through expo-secure-store under one key, device-only', async () => {
    const store = createSecureCredentialStore();
    await store.save('value');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(SESSION_KEY, 'value', options);
    expect(await store.load()).toBe('value');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(SESSION_KEY, options);
  });

  it('clears the key', async () => {
    const store = createSecureCredentialStore();
    await store.save('value');
    await store.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY, options);
    expect(await store.load()).toBeNull();
  });
});
