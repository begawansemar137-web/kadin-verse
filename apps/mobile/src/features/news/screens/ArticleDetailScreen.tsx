import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { isValidContentId } from '@/navigation/deep-link';
import { copy } from '@/shared/copy/id';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

import { ArticleImageView } from '../components/ArticleImage';
import { useArticle } from '../data/use-article';
import { formatPublishedDate } from '../domain/format-date';
import { useNewsSource } from '../news-source-context';

const NotFound = () => (
  <Screen title={copy.news.detailTitle}>
    <Text style={styles.body}>{copy.news.notFound}</Text>
    <Button label={copy.common.backHome} onPress={() => router.replace('/')} />
  </Screen>
);

const LoadedArticle = ({ id }: { id: string }) => {
  const source = useNewsSource();
  const { view, retry } = useArticle(source, id);
  if (view.status === 'not-found') return <NotFound />;
  return (
    <Screen title={copy.news.detailTitle}>
      {source?.isMock ? <MockBadge /> : null}
      <AsyncStateView
        state={view}
        onRetry={retry}
        emptyMessage={copy.news.notFound}
        renderSuccess={(article) => (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {article.title}
            </Text>
            <Text style={styles.meta}>{copy.news.published(formatPublishedDate(article.publishedAt))}</Text>
            <ArticleImageView image={article.image} height={200} />
            {article.body
              .split(/\n{2,}/)
              .filter((paragraph) => paragraph.trim() !== '')
              .map((paragraph, i) => (
                <Text key={i} style={styles.body}>
                  {paragraph}
                </Text>
              ))}
          </>
        )}
      />
    </Screen>
  );
};

/** Plain-text article (ADR-013 §6). Unknown or non-public ids are indistinguishable: both are "not found". */
export const ArticleDetailScreen = ({ id }: { id: string | undefined }) =>
  isValidContentId(id) ? <LoadedArticle id={id} /> : <NotFound />;

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: color.textPrimary },
  meta: { fontSize: fontSize.small, color: color.textSecondary },
  body: { fontSize: fontSize.body, color: color.textPrimary },
});
