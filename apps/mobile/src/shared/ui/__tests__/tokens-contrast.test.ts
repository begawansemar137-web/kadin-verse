import { color, contrastRatio, minTouchTarget, tokenStatus } from '@kadin/design-tokens';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('is symmetric and returns 1 for identical colours', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#1F4E8C', '#1F4E8C')).toBe(1);
  });

  it('rejects malformed hex values', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow('Invalid hex colour');
  });
});

describe('placeholder design tokens', () => {
  it('are flagged as placeholders until KADIN/UX approval', () => {
    expect(tokenStatus).toBe('PLACEHOLDER');
  });

  it.each([
    ['textPrimary', 'background'],
    ['textSecondary', 'background'],
    ['textSecondary', 'surface'],
    ['onPrimary', 'primary'],
    ['danger', 'background'],
    ['primary', 'background'],
  ] as const)('%s on %s meets WCAG AA 4.5:1', (fg, bg) => {
    expect(contrastRatio(color[fg], color[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('sets a 48dp minimum touch target', () => {
    expect(minTouchTarget).toBeGreaterThanOrEqual(48);
  });
});
