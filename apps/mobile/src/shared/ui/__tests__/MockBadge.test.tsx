import { render, screen } from '@testing-library/react-native';

import { copy } from '@/shared/copy/id';
import { MockBadge } from '@/shared/ui/MockBadge';

it('is visible and tells screen readers the data is not official', async () => {
  await render(<MockBadge />);
  expect(screen.getByText(copy.common.mockBadge)).toBeTruthy();
  expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
});
