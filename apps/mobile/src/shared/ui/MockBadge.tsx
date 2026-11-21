import { StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';

export const MockBadge = () => (
  <View style={styles.badge} accessible accessibilityLabel={copy.common.mockBadgeA11y}>
    <Text style={styles.text}>{copy.common.mockBadge}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.danger,
  },
  text: { fontSize: fontSize.small, fontWeight: '700', color: color.danger },
});
