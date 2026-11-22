import { fireEvent, render, screen } from '@testing-library/react-native';

import { ArticleCard } from '@/features/news/components/ArticleCard';
import { ArticleImageView } from '@/features/news/components/ArticleImage';
import { copy } from '@/shared/copy/id';

const image = { url: 'https://media.example.invalid/1.jpg', alt: 'Ilustrasi contoh' };
const article = {
  id: 'a-1',
  title: '[Contoh] Judul',
  summary: 'Ringkasan',
  publishedAt: '2026-11-01T03:00:00.000Z',
  image,
};

describe('ArticleImageView', () => {
  it('renders nothing when there is no image', async () => {
    await render(<ArticleImageView image={null} height={120} />);
    expect(screen.queryByRole('image')).toBeNull();
  });

  it('labels the image with its alt text', async () => {
    await render(<ArticleImageView image={image} height={120} />);
    expect(screen.getByRole('image', { name: 'Ilustrasi contoh' })).toBeTruthy();
    expect(screen.queryByText(copy.news.imageUnavailable)).toBeNull();
  });

  it('AC-005-06: replaces a broken image with a fallback that keeps the alt text', async () => {
    await render(<ArticleImageView image={image} height={120} />);
    await fireEvent(screen.getByRole('image', { name: 'Ilustrasi contoh' }), 'error');
    expect(screen.getByText(copy.news.imageUnavailable)).toBeTruthy();
    expect(screen.getByRole('image', { name: 'Ilustrasi contoh' })).toBeTruthy();
  });
});

describe('ArticleCard', () => {
  it('is one accessible button announcing title and date, and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<ArticleCard article={article} onPress={onPress} />);
    const card = screen.getByRole('button', { name: `[Contoh] Judul, ${copy.news.published('1 Nov 2026')}` });
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
