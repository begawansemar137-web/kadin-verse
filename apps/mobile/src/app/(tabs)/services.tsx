import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { Screen } from '@/shared/ui/Screen';

/** Catalogue arrives with B-004. */
const state: AsyncState<never> = { status: 'empty' };

const ServicesScreen = () => (
  <Screen title={copy.services.heading}>
    <AsyncStateView
      state={state}
      onRetry={() => undefined}
      emptyMessage={copy.services.empty}
      renderSuccess={() => null}
    />
  </Screen>
);

export default ServicesScreen;
