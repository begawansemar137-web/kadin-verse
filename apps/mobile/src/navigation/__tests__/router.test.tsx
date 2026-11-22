import { Stack, router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';

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
import { createFakeAuthProvider } from '@/features/auth/data/fake-auth-provider';
import { createMemoryCredentialStore } from '@/features/auth/data/memory-credential-store';
import { SessionProvider, useSession } from '@/features/auth/session-context';
import { createTestAuthService, FIXED_NOW, seededSession } from '@/features/auth/testing/auth-fixtures';
import { SAMPLE_IDS } from '@/features/news/data/sample-articles';
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
  await waitFor(() => expect(screen).not.toHavePathname('/sign-in'));
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

  it('switches tabs and shows the News feed with synthetic content labelled (AC-004-04)', async () => {
    await open('/');
    await fireEvent.press(screen.getByText(copy.tabs.news));
    expect(screen).toHavePathname('/news');
    expect(await screen.findByText('[Contoh] Forum UMKM Daerah')).toBeTruthy();
    expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
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
    await open(`/news/${SAMPLE_IDS.firstPublished}`);
    expect(await screen.findByRole('header', { name: '[Contoh] Forum UMKM Daerah' })).toBeTruthy();
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

  it('dot-segment link /news/../card resolves to /card and stays gated for guests', async () => {
    // URL parsing collapses `..` before routing, so this never reaches news/[id].
    await open('/news/../card');
    expect(screen).toHavePathname('/sign-in');
    expect(screen.queryByText(copy.card.placeholder)).toBeNull();
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
    return <Button label="probe-sign-out" onPress={() => void signOut()} />;
  };

  const ProbeLayout = () => (
    <SessionProvider service={createTestAuthService({ signedIn: true })}>
      <Stack />
      <SignOutProbe />
    </SessionProvider>
  );

  it('redirects to the gate instead of leaving member content on screen', async () => {
    await renderRouter(
      { _layout: ProbeLayout, card: Card, 'sign-in': SignIn, index: Home },
      { initialUrl: '/card' },
    );
    expect(await screen.findByText(copy.card.placeholder)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'probe-sign-out' }));
    expect(screen).toHavePathname('/sign-in');
    expect(screen.queryByText(copy.card.placeholder)).toBeNull();
  });
});

describe('mock member content is labelled on Beranda', () => {
  const MemberLayout = () => (
    <SessionProvider service={createTestAuthService({ signedIn: true })}>
      <Stack />
    </SessionProvider>
  );

  it('shows the MOCK badge next to the demo member greeting', async () => {
    await renderRouter({ _layout: MemberLayout, index: Home }, { initialUrl: '/' });
    expect(await screen.findByText(copy.home.greetingMember('Anggota Demo'))).toBeTruthy();
    expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
  });

  it('shows no MOCK badge for a guest (nothing synthetic on screen)', async () => {
    await open('/');
    expect(screen.queryByLabelText(copy.common.mockBadgeA11y)).toBeNull();
  });
});

describe('B-002 sign-in states', () => {
  const layoutWith = (service: ReturnType<typeof createTestAuthService>) => {
    const Layout = () => (
      <SessionProvider service={service}>
        <Stack />
      </SessionProvider>
    );
    return Layout;
  };

  it('shows a safe message when sign-in fails and stays on the gate', async () => {
    const provider = createFakeAuthProvider({ signIn: 'network', now: () => FIXED_NOW });
    await renderRouter(
      { _layout: layoutWith(createTestAuthService({ provider })), 'sign-in': SignIn, card: Card, index: Home },
      { initialUrl: '/sign-in?returnTo=/card' },
    );
    await fireEvent.press(await screen.findByRole('button', { name: copy.signIn.mockButton }));
    expect(await screen.findByText(copy.signIn.failed.network)).toBeTruthy();
    expect(screen).toHavePathname('/sign-in');
  });

  it('AUTH-002: an expired stored session lands on the gate with an expired notice', async () => {
    const now = () => FIXED_NOW;
    const provider = createFakeAuthProvider({ refresh: 'rejected', now });
    const store = createMemoryCredentialStore(seededSession({ expiresAt: FIXED_NOW - 1 }));
    await renderRouter(
      {
        _layout: layoutWith(createTestAuthService({ provider, store, now })),
        'sign-in': SignIn,
        card: Card,
        index: Home,
      },
      { initialUrl: '/card' },
    );
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    expect(await screen.findByText(copy.signIn.expired)).toBeTruthy();
    expect(screen.queryByText(copy.card.placeholder)).toBeNull();
  });

  it('announces sign-in failure and the expired notice to screen readers', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const now = () => FIXED_NOW;
    const provider = createFakeAuthProvider({ refresh: 'rejected', signIn: 'network', now });
    const store = createMemoryCredentialStore(seededSession({ expiresAt: FIXED_NOW - 1 }));
    await renderRouter(
      { _layout: layoutWith(createTestAuthService({ provider, store, now })), 'sign-in': SignIn, card: Card, index: Home },
      { initialUrl: '/card' },
    );
    await waitFor(() => expect(announce).toHaveBeenCalledWith(copy.signIn.expired));
    await fireEvent.press(await screen.findByRole('button', { name: copy.signIn.mockButton }));
    await waitFor(() => expect(announce).toHaveBeenCalledWith(copy.signIn.failed.network));
    announce.mockRestore();
  });

  it('a signed-in member reopening the app goes straight to the card (no gate flash)', async () => {
    await renderRouter(
      { _layout: layoutWith(createTestAuthService({ signedIn: true })), 'sign-in': SignIn, card: Card, index: Home },
      { initialUrl: '/card' },
    );
    expect(await screen.findByText(copy.card.placeholder)).toBeTruthy();
    expect(screen).toHavePathname('/card');
  });
});

describe('B-003 public news journeys', () => {
  it('guest opens an article from the feed and goes back to the feed', async () => {
    await open('/news');
    await fireEvent.press(await screen.findByRole('button', { name: /\[Contoh\] Forum UMKM Daerah/ }));
    expect(screen).toHavePathname(`/news/${SAMPLE_IDS.firstPublished}`);
    expect(await screen.findByText('Konten ini sintetis dan hanya untuk pengujian.')).toBeTruthy();
    await act(async () => {
      router.back();
    });
    expect(screen).toHavePathname('/news');
  });

  it.each([
    ['draft', SAMPLE_IDS.draft],
    ['in review', SAMPLE_IDS.inReview],
    ['archived', SAMPLE_IDS.archived],
    ['scheduled', SAMPLE_IDS.scheduled],
  ])('Review Focus 5: a deep link to a %s article shows not-found with a way home', async (_label, id) => {
    await open(`/news/${id}`);
    expect(await screen.findByText(copy.news.notFound)).toBeTruthy();
    expect(screen.queryByText('Tidak boleh tampil di aplikasi.')).toBeNull();
    expect(screen.getByRole('button', { name: copy.common.backHome })).toBeTruthy();
  });
});
