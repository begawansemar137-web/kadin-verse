import { createContext, useContext, useState, type ReactNode } from 'react';

import { createDefaultNewsSource } from './default-news-source';
import type { NewsSource } from './domain/news-source';

const NewsSourceContext = createContext<NewsSource | null>(null);

type Props = { source?: NewsSource | null; children: ReactNode };

/** `source` is for tests; `undefined` means the app default, `null` means "no content source". */
export const NewsSourceProvider = ({ source, children }: Props) => {
  const [value] = useState(() => (source === undefined ? createDefaultNewsSource() : source));
  return <NewsSourceContext.Provider value={value}>{children}</NewsSourceContext.Provider>;
};

export const useNewsSource = (): NewsSource | null => useContext(NewsSourceContext);
