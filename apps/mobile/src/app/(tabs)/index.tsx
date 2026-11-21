import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { HomeTile } from '@/features/home/components/HomeTile';
import { canAccess } from '@/navigation/access';
import { copy } from '@/shared/copy/id';
import { Screen } from '@/shared/ui/Screen';

const HomeScreen = () => {
  const { session } = useSession();
  const greeting =
    session.status === 'member'
      ? copy.home.greetingMember(session.displayName)
      : copy.home.greetingGuest;

  return (
    <Screen title={copy.home.heading}>
      <Text style={styles.greeting}>{greeting}</Text>
      <HomeTile label={copy.home.tileNews} href="/news" />
      <HomeTile label={copy.home.tileServices} href="/services" />
      <HomeTile label={copy.home.tileCard} href="/card" locked={!canAccess('/card', session)} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  greeting: { fontSize: fontSize.body, color: color.textSecondary },
});

export default HomeScreen;
