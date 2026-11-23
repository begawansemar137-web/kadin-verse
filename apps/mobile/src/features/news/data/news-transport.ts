/** Request/response shape of the provisional public news routes (ADR-013 §3). A real HTTP transport implements this. */
export type NewsRequest = { route: 'list'; cursor: string | null; limit: number } | { route: 'detail'; id: string };
export type NewsResponse = { status: number; body: unknown };
/** Rejects only when the network itself fails; HTTP errors resolve with their status. */
export type NewsTransport = (req: NewsRequest) => Promise<NewsResponse>;
