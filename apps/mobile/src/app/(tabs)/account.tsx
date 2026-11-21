import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

const AccountScreen = () => {
  const { session, signOut } = useSession();

  if (session.status === 'guest') {
    return (
      <Screen title={copy.account.heading}>
        <Text style={styles.body}>{copy.account.guest}</Text>
        <Button
          label={copy.account.signIn}
          onPress={() => router.push({ pathname: '/sign-in', params: { returnTo: '/account' } })}
        />
      </Screen>
    );
  }

  return (
    <Screen title={copy.account.heading}>
      <MockBadge />
      <Text style={styles.body}>{copy.home.greetingMember(session.displayName)}</Text>
      <Button label={copy.account.openCard} onPress={() => router.push('/card')} />
      <Button variant="secondary" label={copy.account.signOut} onPress={signOut} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default AccountScreen;
