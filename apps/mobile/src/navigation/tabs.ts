import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { copy } from '@/shared/copy/id';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TabConfig = {
  name: 'index' | 'news' | 'services' | 'account';
  label: string;
  icon: IoniconName;
};

/** PROPOSED order and labels. Change here only, after UX approval (BR-005). */
export const TABS: readonly TabConfig[] = [
  { name: 'index', label: copy.tabs.home, icon: 'home-outline' },
  { name: 'news', label: copy.tabs.news, icon: 'newspaper-outline' },
  { name: 'services', label: copy.tabs.services, icon: 'briefcase-outline' },
  { name: 'account', label: copy.tabs.account, icon: 'person-circle-outline' },
];
