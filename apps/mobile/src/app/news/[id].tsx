import { useLocalSearchParams } from 'expo-router';

import { ArticleDetailScreen } from '@/features/news/screens/ArticleDetailScreen';

const NewsDetailRoute = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <ArticleDetailScreen id={typeof params.id === 'string' ? params.id : undefined} />;
};

export default NewsDetailRoute;
