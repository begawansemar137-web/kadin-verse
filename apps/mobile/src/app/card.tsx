import { Redirect } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { canAccess } from '@/navigation/access';
import { copy } from '@/shared/copy/id';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

/** Placeholder only. Real card/QR is B-005/B-006, gated on ADR-004/ADR-005. */
const CardScreen = () => {
  const { session } = useSession();

  // Wait for the stored session before deciding, so a signed-in member never flashes the gate.
  if (session.status === 'restoring') {
    return (
      <Screen title={copy.card.heading}>
        <AsyncStateView state={{ status: 'loading' }} onRetry={() => undefined} emptyMessage="" renderSuccess={() => null} />
      </Screen>
    );
  }

  if (!canAccess('/card', session)) {
    return <Redirect href={{ pathname: '/sign-in', params: { returnTo: '/card' } }} />;
  }

  return (
    <Screen title={copy.card.heading}>
      <MockBadge />
      <Text style={styles.body}>{copy.card.placeholder}</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default CardScreen;
