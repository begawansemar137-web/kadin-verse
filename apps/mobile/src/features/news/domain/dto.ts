import { isValidContentId } from '@/navigation/deep-link';

import type { Article, ArticleImage, ArticleSummary, Page } from './article';

type Json = Record<string, unknown>;

const isRecord = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const isIsoUtc = (v: unknown): v is string => typeof v === 'string' && ISO_UTC.test(v) && !Number.isNaN(Date.parse(v));
// RN's URL polyfill lacks `protocol`, so the scheme is checked by pattern.
const HTTPS_URL = /^https:\/\/[^\s/?#]+[^\s]*$/;

/** BR-005: an image without alt text or a safe https URL is dropped, never shown. */
const parseImage = (v: unknown): ArticleImage | null => {
  if (!isRecord(v) || typeof v.url !== 'string' || !HTTPS_URL.test(v.url) || !isText(v.alt)) return null;
  return { url: v.url, alt: v.alt.trim() };
};

const parseSummary = (v: unknown): ArticleSummary | null => {
  if (!isRecord(v)) return null;
  const { id, title, summary, publishedAt } = v;
  if (typeof id !== 'string' || !isValidContentId(id) || !isText(title) || typeof summary !== 'string') return null;
  if (!isIsoUtc(publishedAt)) return null;
  return { id, title, summary, publishedAt, image: parseImage(v.image) };
};

/** A page with any malformed article is rejected whole: a contract violation is shown as an error, not hidden. */
export const parseArticleSummaryPage = (raw: unknown): Page<ArticleSummary> | null => {
  if (!isRecord(raw) || !Array.isArray(raw.data) || !isRecord(raw.page)) return null;
  const { nextCursor } = raw.page;
  if (nextCursor !== null && typeof nextCursor !== 'string') return null;
  const items: ArticleSummary[] = [];
  for (const entry of raw.data) {
    const item = parseSummary(entry);
    if (item === null) return null;
    items.push(item);
  }
  return { items, nextCursor };
};

export const parseArticleDetail = (raw: unknown): Article | null => {
  if (!isRecord(raw) || !isRecord(raw.data) || typeof raw.data.body !== 'string') return null;
  const summary = parseSummary(raw.data);
  return summary === null ? null : { ...summary, body: raw.data.body };
};
