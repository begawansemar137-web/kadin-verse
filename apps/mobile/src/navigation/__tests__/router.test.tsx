import { Stack, router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { act, fireEvent } from '@testing-library/react-native';

import * as RootLayout from '@/app/_layout';
import * as TabsLayout from '@/app/(tabs)/_layout';
import * as Home from '@/app/(tabs)/index';
import * as News from '@/app/(tabs)/news';
import * as Services from '@/app/(tabs)/services';
import * as Account from '@/app/(tabs)/account';
import * as NewsDetail from '@/app/news/[id]';
import * as Card from '@/app/card';
import * as SignIn from '@/app/sign-in';
import * as NotFound from '@/app/+not-found';
import { MOCK_MEMBER } from '@/features/auth/domain/session';
import { SessionProvider, useSession } from '@/features/auth/session-context';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/news': News,
  '(tabs)/services': Services,
  '(tabs)/account': Account,
  'news/[id]': NewsDetail,
  card: Card,
  'sign-in': SignIn,
  '+not-found': NotFound,
};

const open = (initialUrl: string) => renderRouter(routes, { initialUrl });

const signInFromGate = async () => {
  await fireEvent.press(screen.getByRole('button', { name: copy.signIn.mockButton }));
};

describe('B-001 navigation shell', () => {
  it('AC-004-01: guest lands on Beranda with all four tabs, no login required', async () => {
    await open('/');
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('header', { name: copy.home.heading })).toBeTruthy();
    for (const label of Object.values(copy.tabs)) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('switches tabs and shows the News empty state (AC-004-04)', async () => {
    await open('/');
    await fireEvent.press(screen.getByText(copy.tabs.news));
    expect(screen).toHavePathname('/news');
    expect(screen.getByText(copy.news.empty)).toBeTruthy();
  });

  it('AC-004-02: guest opening the member card is sent to the sign-in gate', async () => {
    await open('/');
    await fireEvent.press(screen.getByRole('link', { name: new RegExp(copy.home.tileCard) }));
    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByRole('header', { name: copy.signIn.heading })).toBeTruthy();
  });

  it('deep link to /card as guest is gated, and mock sign-in returns to /card', async () => {
    await open('/card');
    expect(screen).toHavePathname('/sign-in');
    await signInFromGate();
    expect(screen).toHavePathname('/card');
    expect(screen.getByText(copy.card.placeholder)).toBeTruthy();
    expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
  });

  it('ignores an external returnTo and lands on / (open-redirect guard)', async () => {
    await open('/sign-in?returnTo=https%3A%2F%2Fevil.example');
    await signInFromGate();
    expect(screen).toHavePathname('/');
  });

  it('cold deep link to news detail still has a back path to Beranda', async () => {
    await open('/news/abc-123');
    expect(screen.getByText(copy.news.detailPlaceholder)).toBeTruthy();
    expect(router.canGoBack()).toBe(true);
    await act(async () => {
      router.back();
    });
    expect(screen).toHavePathname('/');
  });

  it('AC-004-03: malformed content id shows a safe fallback with a way home', async () => {
    await open('/news/bad%20id');
    expect(screen.getByText(copy.news.notFound)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.backHome }));
    expect(screen).toHavePathname('/');
  });

  it('unknown route shows not-found with a way home (no dead end)', async () => {
    await open('/does-not-exist');
    expect(screen.getByRole('header', { name: copy.notFound.heading })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.backHome }));
    expect(screen).toHavePathname('/');
  });

  it('member can sign out from Akun and the card is gated again', async () => {
    await open('/account');
    await fireEvent.press(screen.getByRole('button', { name: copy.account.signIn }));
    await signInFromGate();
    expect(screen).toHavePathname('/account');
    await fireEvent.press(screen.getByRole('button', { name: copy.account.signOut }));
    expect(screen.getByText(copy.account.guest)).toBeTruthy();
    await act(async () => {
      router.push('/card');
    });
    expect(screen).toHavePathname('/sign-in');
  });
});

describe('session ends while on a protected route', () => {
  const SignOutProbe = () => {
    const { signOut } = useSession();
    return <Button label="probe-sign-out" onPress={signOut} />;
  };

  const ProbeLayout = () => (
    <SessionProvider initialSession={MOCK_MEMBER}>
      <Stack />
      <SignOutProbe />
    </SessionProvider>
  );

  it('redirects to the gate instead of leaving member content on screen', async () => {
    await renderRouter(
      { _layout: ProbeLayout, card: Card, 'sign-in': SignIn, index: Home },
      { initialUrl: '/card' },
    );
    expect(screen.getByText(copy.card.placeholder)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'probe-sign-out' }));
    expect(screen).toHavePathname('/sign-in');
    expect(screen.queryByText(copy.card.placeholder)).toBeNull();
  });
});
