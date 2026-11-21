import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';

type AppErrorFallbackProps = { onRetry: () => void };

/** Shown when a screen crashes. Must not depend on session or other app providers. */
export const AppErrorFallback = ({ onRetry }: AppErrorFallbackProps) => (
  <Screen title={copy.error.heading}>
    <Text style={styles.body}>{copy.error.body}</Text>
    <Button label={copy.common.retry} onPress={onRetry} />
  </Screen>
);

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});
