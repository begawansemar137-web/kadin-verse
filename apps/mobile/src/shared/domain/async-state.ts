/** Typed UI state model (SPEC-004 §3). `message` must already be safe to show users. */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'offline' };
