/** Stores one opaque serialised session (ADR-003 §3). Must be platform secure storage in the app. */
export type CredentialStore = {
  load: () => Promise<string | null>;
  save: (value: string) => Promise<void>;
  clear: () => Promise<void>;
};
