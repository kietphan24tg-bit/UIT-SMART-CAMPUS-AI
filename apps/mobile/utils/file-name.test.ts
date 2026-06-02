import { decodeDisplayFileName } from './file-name';

describe('decodeDisplayFileName', () => {
  it('decodes percent-encoded file names for display', () => {
    expect(decodeDisplayFileName('Copy%20of%20Gi%C3%A1o%20tr%C3%ACnh.pdf')).toBe(
      'Copy of Giáo trình.pdf',
    );
  });

  it('returns the original value when the input cannot be decoded safely', () => {
    expect(decodeDisplayFileName('100% giao-trinh.pdf')).toBe('100% giao-trinh.pdf');
  });
});
