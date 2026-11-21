import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, fontSize, space } from '@kadin/design-tokens';

type ScreenProps = { title: string; children?: ReactNode };

export const Screen = ({ title, children }: ScreenProps) => (
  <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {children}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  content: { padding: space.md, gap: space.md },
  title: { fontSize: fontSize.heading, fontWeight: '700', color: color.textPrimary },
});
