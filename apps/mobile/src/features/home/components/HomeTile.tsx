import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, fontSize, minTouchTarget, radius, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';

type HomeTileProps = { label: string; href: Href; locked?: boolean };

export const HomeTile = ({ label, href, locked = false }: HomeTileProps) => (
  <Link href={href} asChild>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={locked ? `${label}, ${copy.home.lockedHint}` : label}
      style={styles.tile}
    >
      <Text style={styles.label}>{label}</Text>
      {locked ? <Text style={styles.hint}>{copy.home.lockedHint}</Text> : null}
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  tile: {
    minHeight: minTouchTarget,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.title, fontWeight: '600', color: color.textPrimary },
  hint: { fontSize: fontSize.small, color: color.textSecondary },
});
