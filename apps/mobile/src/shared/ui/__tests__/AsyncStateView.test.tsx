import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';

const renderState = (state: AsyncState<string>, onRetry = jest.fn()) =>
  render(
    <AsyncStateView
      state={state}
      onRetry={onRetry}
      emptyMessage="Belum ada data."
      renderSuccess={(data) => <Text>{data}</Text>}
    />,
  );

describe('AsyncStateView', () => {
  it.each<AsyncState<string>>([{ status: 'idle' }, { status: 'loading' }])(
    'announces loading for %o',
    async (state) => {
      await renderState(state);
      expect(screen.getByLabelText(copy.common.loading)).toBeTruthy();
    },
  );

  it('renders success content', async () => {
    await renderState({ status: 'success', data: 'Isi' });
    expect(screen.getByText('Isi')).toBeTruthy();
  });

  it('renders the empty message', async () => {
    await renderState({ status: 'empty' });
    expect(screen.getByText('Belum ada data.')).toBeTruthy();
  });

  it('renders a safe error message with retry', async () => {
    const onRetry = jest.fn();
    await renderState({ status: 'error', message: 'Gagal memuat.' }, onRetry);
    expect(screen.getByText('Gagal memuat.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders offline guidance with retry', async () => {
    const onRetry = jest.fn();
    await renderState({ status: 'offline' }, onRetry);
    expect(screen.getByText(copy.common.offline)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
