/** Feature flags for unapproved integrations (SPEC-004 §3). */
export const flags = {
  /** In-memory demo sign-in. Must be false before any non-demo release. */
  mockAuth: true,
} as const;
