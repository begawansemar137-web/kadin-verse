import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import type { AuthFailure } from '@/features/auth/domain/auth-provider';
import { useSession } from '@/features/auth/session-context';
import { safeReturnTo } from '@/navigation/deep-link';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

/** Sign-in gate. Uses the fake provider in dev/preview only; the real IdP is gated on D-03 (ADR-003). */
const SignInScreen = () => {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { session, canSignIn, signIn } = useSession();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const target = safeReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined);
  const expired = session.status === 'guest' && session.notice === 'expired';

  const onSignIn = async () => {
    setPending(true);
    setFailure(null);
    const outcome = await signIn();
    setPending(false);
    if (outcome === 'ok') {
      router.replace(target);
    } else if (outcome !== 'unavailable') {
      setFailure(outcome);
    }
  };

  return (
    <Screen title={copy.signIn.heading}>
      {expired && failure === null ? (
        <Text accessibilityRole="alert" style={styles.notice}>
          {copy.signIn.expired}
        </Text>
      ) : null}
      {failure !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {copy.signIn.failed[failure]}
        </Text>
      ) : null}
      <Text style={styles.body}>{copy.signIn.explainer}</Text>
      {canSignIn ? (
        <>
          <MockBadge />
          <Button label={copy.signIn.mockButton} disabled={pending} onPress={() => void onSignIn()} />
        </>
      ) : null}
      <Button variant="secondary" label={copy.common.backHome} onPress={() => router.replace('/')} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
  notice: { fontSize: fontSize.body, color: color.textPrimary, fontWeight: '600' },
  error: { fontSize: fontSize.body, color: color.danger, fontWeight: '600' },
});

export default SignInScreen;
