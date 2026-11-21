import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { Screen } from '@/shared/ui/Screen';

/** Content arrives with B-003. Until then the feed is honestly empty. */
const state: AsyncState<never> = { status: 'empty' };

const NewsScreen = () => (
  <Screen title={copy.news.heading}>
    <AsyncStateView
      state={state}
      onRetry={() => undefined}
      emptyMessage={copy.news.empty}
      renderSuccess={() => null}
    />
  </Screen>
);

export default NewsScreen;
