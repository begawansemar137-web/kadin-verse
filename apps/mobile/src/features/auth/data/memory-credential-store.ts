import type { CredentialStore } from '../domain/credential-store';

/** Test double: not secure storage. Never wire this into the app. */
export const createMemoryCredentialStore = (initial: string | null = null): CredentialStore => {
  let value = initial;
  return {
    load: async () => value,
    save: async (next) => {
      value = next;
    },
    clear: async () => {
      value = null;
    },
  };
};
