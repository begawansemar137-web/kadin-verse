import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { Button } from '@/shared/ui/Button';

type AsyncStateViewProps<T> = {
  state: AsyncState<T>;
  onRetry: () => void;
  emptyMessage: string;
  renderSuccess: (data: T) => ReactNode;
};

export const AsyncStateView = <T,>({
  state,
  onRetry,
  emptyMessage,
  renderSuccess,
}: AsyncStateViewProps<T>) => {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return (
        <View style={styles.center} accessible accessibilityLabel={copy.common.loading}>
          <ActivityIndicator color={color.primary} />
        </View>
      );
    case 'success':
      return <>{renderSuccess(state.data)}</>;
    case 'empty':
      return (
        <View style={styles.center}>
          <Text style={styles.message}>{emptyMessage}</Text>
        </View>
      );
    case 'error':
      return (
        <View style={styles.center}>
          <Text style={[styles.message, styles.error]}>{state.message}</Text>
          <Button label={copy.common.retry} onPress={onRetry} />
        </View>
      );
    case 'offline':
      return (
        <View style={styles.center}>
          <Text style={styles.message}>{copy.common.offline}</Text>
          <Button label={copy.common.retry} onPress={onRetry} />
        </View>
      );
  }
};

const styles = StyleSheet.create({
  center: { paddingVertical: space.xl, alignItems: 'center', gap: space.md },
  message: { fontSize: fontSize.body, color: color.textSecondary, textAlign: 'center' },
  error: { color: color.danger },
});
