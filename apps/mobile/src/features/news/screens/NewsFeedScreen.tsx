import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { color, fontSize, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

import { ArticleCard } from '../components/ArticleCard';
import { useNewsFeed } from '../data/use-news-feed';
import { useNewsSource } from '../news-source-context';

export const NewsFeedScreen = () => {
  const source = useNewsSource();
  const feed = useNewsFeed(source);
  return (
    <Screen title={copy.news.heading}>
      {source?.isMock ? <MockBadge /> : null}
      <AsyncStateView
        state={feed.list}
        onRetry={feed.retry}
        emptyMessage={copy.news.empty}
        renderSuccess={(articles) => (
          <View style={styles.list}>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} onPress={() => router.push(`/news/${article.id}`)} />
            ))}
            {feed.loadMoreFailed ? (
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.alert}>
                {copy.news.loadMoreFailed}
              </Text>
            ) : null}
            {feed.hasMore ? (
              <Button label={copy.news.loadMore} onPress={feed.loadMore} disabled={feed.loadingMore} />
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: { gap: space.md },
  alert: { fontSize: fontSize.body, color: color.danger },
});
