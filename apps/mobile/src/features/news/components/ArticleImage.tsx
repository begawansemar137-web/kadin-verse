import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';

import type { ArticleImage } from '../domain/article';

type Props = { image: ArticleImage | null; height: number };

/** AC-005-06: a failed image becomes a neutral placeholder that keeps the alt text for screen readers. */
export const ArticleImageView = ({ image, height }: Props) => {
  const [failed, setFailed] = useState(false);
  if (!image) return null;
  if (failed) {
    return (
      <View
        style={[styles.frame, styles.fallback, { height }]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={image.alt}
      >
        <Text style={styles.fallbackText}>{copy.news.imageUnavailable}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: image.url }}
      style={[styles.frame, { height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={image.alt}
      onError={() => setFailed(true)}
    />
  );
};

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.md, backgroundColor: color.surface },
  fallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.border },
  fallbackText: { fontSize: fontSize.small, color: color.textSecondary },
});
