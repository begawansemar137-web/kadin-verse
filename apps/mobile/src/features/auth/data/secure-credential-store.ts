import * as SecureStore from 'expo-secure-store';

import type { CredentialStore } from '../domain/credential-store';

export const SESSION_KEY = 'kadin.verse.session.v1';

/** Keychain/Keystore entry readable only while unlocked and never migrated to another device. */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const createSecureCredentialStore = (): CredentialStore => ({
  load: () => SecureStore.getItemAsync(SESSION_KEY, OPTIONS),
  save: (value) => SecureStore.setItemAsync(SESSION_KEY, value, OPTIONS),
  clear: () => SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS),
});
