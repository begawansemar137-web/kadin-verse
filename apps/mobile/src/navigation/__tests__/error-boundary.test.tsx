import { Text } from 'react-native';
import { Slot } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { fireEvent } from '@testing-library/react-native';

import * as RootLayout from '@/app/_layout';
import { copy } from '@/shared/copy/id';

const SECRET = 'internal-detail-do-not-show-42';
let shouldThrow = true;

const Boom = () => {
  if (shouldThrow) {
    throw new Error(SECRET);
  }
  return <Text>pulih</Text>;
};

// The real root layout anchors on the (tabs) group, so the crashing screen lives inside it.
const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': { default: () => <Slot /> },
  '(tabs)/index': { default: Boom },
};

describe('app-wide error boundary (root layout)', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React and Expo Router report the caught error; keep test output clean.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('replaces a crashed screen with a safe Indonesian message instead of a blank screen', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByRole('header', { name: copy.error.heading })).toBeTruthy();
    expect(screen.getByText(copy.error.body)).toBeTruthy();
  });

  it('never shows the raw error message to the user', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.queryByText(new RegExp(SECRET))).toBeNull();
  });

  it('lets the user retry and recover once the cause is gone', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    shouldThrow = false;
    await fireEvent.press(screen.getByRole('button', { name: copy.common.retry }));
    expect(await screen.findByText('pulih')).toBeTruthy();
  });
});
