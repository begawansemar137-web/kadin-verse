import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { minTouchTarget } from '@kadin/design-tokens';

import { Button } from '@/shared/ui/Button';

describe('Button', () => {
  it('exposes an accessible button role and label', async () => {
    await render(<Button label="Coba lagi" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Masuk" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Masuk' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('meets the 48dp minimum and grows with large text instead of clipping', async () => {
    await render(<Button label="Masuk" onPress={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Masuk' }).props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(minTouchTarget);
    expect(style.minWidth).toBeGreaterThanOrEqual(minTouchTarget);
    expect(style.height).toBeUndefined();
    expect(screen.getByText('Masuk').props.allowFontScaling).not.toBe(false);
  });

  it('can be disabled: no press, announced as disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Kirim" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Kirim' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
