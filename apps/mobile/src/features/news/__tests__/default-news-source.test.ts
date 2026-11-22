import { createDefaultNewsSource } from '@/features/news/default-news-source';

describe('createDefaultNewsSource (ADR-013 §8)', () => {
  it('wires the synthetic CMS, marked as mock, when mockContent is on', async () => {
    const source = createDefaultNewsSource({ mockContent: true });
    expect(source?.isMock).toBe(true);
    const page = await source?.listPublished(null);
    expect(page?.ok && page.value.items.length).toBeGreaterThan(0);
  });

  it('has no source at all when mockContent is off', () => {
    expect(createDefaultNewsSource({ mockContent: false })).toBeNull();
  });
});
