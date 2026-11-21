import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { safeReturnTo } from '@/navigation/deep-link';
import { flags } from '@/shared/config/flags';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

/** Sign-in gate. Real identity is B-002 (blocked on ADR-003 / D-03). */
const SignInScreen = () => {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { signInMock } = useSession();
  const target = safeReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined);

  return (
    <Screen title={copy.signIn.heading}>
      <Text style={styles.body}>{copy.signIn.explainer}</Text>
      {flags.mockAuth ? (
        <>
          <MockBadge />
          <Button
            label={copy.signIn.mockButton}
            onPress={() => {
              signInMock();
              router.replace(target);
            }}
          />
        </>
      ) : null}
      <Button variant="secondary" label={copy.common.backHome} onPress={() => router.replace('/')} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default SignInScreen;
