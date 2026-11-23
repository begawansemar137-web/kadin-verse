import { Pressable, StyleSheet, Text } from 'react-native';
import { color, fontSize, minTouchTarget, radius, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';

import type { ArticleSummary } from '../domain/article';
import { formatPublishedDate } from '../domain/format-date';
import { ArticleImageView } from './ArticleImage';

type Props = { article: ArticleSummary; onPress: () => void };

export const ArticleCard = ({ article, onPress }: Props) => {
  const published = copy.news.published(formatPublishedDate(article.publishedAt));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${article.title}, ${published}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ArticleImageView image={article.image} height={140} />
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.meta}>{published}</Text>
      {article.summary ? <Text style={styles.summary}>{article.summary}</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: minTouchTarget,
    padding: space.md,
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.background,
  },
  pressed: { backgroundColor: color.surface },
  title: { fontSize: fontSize.body, fontWeight: '700', color: color.textPrimary },
  meta: { fontSize: fontSize.small, color: color.textSecondary },
  summary: { fontSize: fontSize.body, color: color.textPrimary },
});
