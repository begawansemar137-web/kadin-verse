import { Pressable, StyleSheet, Text } from 'react-native';
import { color, fontSize, minTouchTarget, radius, space } from '@kadin/design-tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
  disabled?: boolean;
};

export const Button = ({ label, onPress, variant = 'primary', accessibilityHint, disabled = false }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.background, borderWidth: 1, borderColor: color.primary },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: fontSize.body, fontWeight: '600' },
  labelPrimary: { color: color.onPrimary },
  labelSecondary: { color: color.primary },
});
