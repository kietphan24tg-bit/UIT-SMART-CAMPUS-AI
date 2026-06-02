import { Image } from 'expo-image';

import { prefetchImageUrl, prefetchImageUrls } from './image-cache';

const mockedExpoImage = Image as unknown as { prefetch: jest.Mock };

describe('image cache helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedExpoImage.prefetch.mockResolvedValue(true);
  });

  it('ignores empty image urls', async () => {
    await prefetchImageUrls([undefined, null, '', '   ']);

    expect(mockedExpoImage.prefetch).not.toHaveBeenCalled();
  });

  it('prefetches each unique image url only once per batch', async () => {
    await prefetchImageUrls([
      ' https://img.test/book-1.jpg ',
      'https://img.test/book-1.jpg',
      'https://img.test/book-2.jpg',
    ]);

    expect(mockedExpoImage.prefetch).toHaveBeenCalledTimes(2);
    expect(mockedExpoImage.prefetch).toHaveBeenNthCalledWith(
      1,
      ['https://img.test/book-1.jpg'],
      'disk',
    );
    expect(mockedExpoImage.prefetch).toHaveBeenNthCalledWith(
      2,
      ['https://img.test/book-2.jpg'],
      'disk',
    );
  });

  it('does not throw when image prefetch fails', async () => {
    mockedExpoImage.prefetch.mockRejectedValueOnce(new Error('Network Error'));

    await expect(prefetchImageUrl('https://img.test/book-3.jpg')).resolves.toBeUndefined();
  });
});
