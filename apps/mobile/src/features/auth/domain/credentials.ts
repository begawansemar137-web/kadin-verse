/** Credential model for the auth boundary (ADR-003). Values here never reach React state or logs. */
export type Credentials = { accessToken: string; refreshToken: string | null; expiresAt: number };
export type AuthUser = { subject: string; displayName: string };
export type StoredSession = { credentials: Credentials; user: AuthUser };

/** PLACEHOLDER skew pending security approval of token lifetimes (ADR-003 §Out of scope). */
export const EXPIRY_SKEW_MS = 30_000;

const FORMAT_VERSION = 1;

export const isExpired = (credentials: Credentials, now: number, skewMs = EXPIRY_SKEW_MS): boolean =>
  now >= credentials.expiresAt - skewMs;

export const serializeStoredSession = (session: StoredSession): string =>
  JSON.stringify({ v: FORMAT_VERSION, credentials: session.credentials, user: session.user });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** Returns null for anything that is not a well-formed v1 record: callers treat that as "no session". */
export const parseStoredSession = (raw: string | null): StoredSession | null => {
  if (raw === null) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(data) || data.v !== FORMAT_VERSION) return null;
  const { credentials, user } = data;
  if (!isRecord(credentials) || !isRecord(user)) return null;

  const { accessToken, refreshToken, expiresAt } = credentials;
  const { subject, displayName } = user;

  if (!isNonEmptyString(accessToken)) return null;
  if (refreshToken !== null && !isNonEmptyString(refreshToken)) return null;
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return null;
  if (!isNonEmptyString(subject) || !isNonEmptyString(displayName)) return null;

  return { credentials: { accessToken, refreshToken, expiresAt }, user: { subject, displayName } };
};
