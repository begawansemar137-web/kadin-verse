import { router } from 'expo-router';

import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';

const NotFoundScreen = () => (
  <Screen title={copy.notFound.heading}>
    <Button label={copy.common.backHome} onPress={() => router.replace('/')} />
  </Screen>
);

export default NotFoundScreen;
