import type { Href } from 'expo-router';

const CONTENT_ID = /^[A-Za-z0-9-]{1,64}$/;

export const isValidContentId = (id: string | undefined): id is string =>
  id !== undefined && CONTENT_ID.test(id);

/** In-app destinations a sign-in may return to. `/sign-in` is excluded to avoid loops. */
const RETURNABLE: readonly RegExp[] = [
  /^\/$/,
  /^\/news$/,
  /^\/news\/[A-Za-z0-9-]{1,64}$/,
  /^\/services$/,
  /^\/account$/,
  /^\/card$/,
];

const hasUnsafeChars = (value: string): boolean =>
  [...value].some((ch) => ch.charCodeAt(0) < 0x20 || ch === '\\');

const normalize = (raw: string): string | null => {
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  const pathOnly = raw.split(/[?#]/, 1)[0] ?? '';
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch {
    return null;
  }
  if (decoded.startsWith('//') || decoded.includes('..') || hasUnsafeChars(decoded)) return null;
  const trimmed = decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded;
  return RETURNABLE.some((pattern) => pattern.test(trimmed)) ? trimmed : null;
};

/**
 * Sanitises a `returnTo` query value. Anything that is not a known in-app route
 * (external URLs, protocol-relative URLs, traversal, unknown paths) becomes '/'.
 */
export const safeReturnTo = (raw: string | undefined): Href => {
  const path = raw === undefined ? null : normalize(raw);
  // Cast is safe: `path` has been matched against the RETURNABLE whitelist of real routes.
  return (path ?? '/') as Href;
};
