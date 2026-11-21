import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { isValidContentId } from '@/navigation/deep-link';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';

const NewsDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  if (!isValidContentId(id)) {
    return (
      <Screen title={copy.news.detailTitle}>
        <Text style={styles.body}>{copy.news.notFound}</Text>
        <Button label={copy.common.backHome} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen title={copy.news.detailTitle}>
      <Text style={styles.body}>{copy.news.detailPlaceholder}</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default NewsDetailScreen;
