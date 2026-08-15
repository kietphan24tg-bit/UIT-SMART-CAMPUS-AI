import { repairMojibakeText } from '@/utils/text-encoding';

describe('repairMojibakeText', () => {
  it('repairs the Windows-1252 mojibake emitted by canteen payments', () => {
    expect(repairMojibakeText('ÄÆ¡n canteen Ä‘Ã£ thanh toÃ¡n')).toBe('Đơn canteen đã thanh toán');
    expect(repairMojibakeText('Thanh toÃ¡n Ä‘Æ¡n hÃ ng canteen thÃ nh cÃ´ng.')).toBe(
      'Thanh toán đơn hàng canteen thành công.',
    );
  });

  it('does not depend on the Node Buffer global used by Jest', () => {
    const bufferDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Buffer');
    Object.defineProperty(globalThis, 'Buffer', {
      configurable: true,
      value: undefined,
    });

    try {
      expect(repairMojibakeText('Cáº£nh bÃ¡o')).toBe('Cảnh báo');
    } finally {
      if (bufferDescriptor) {
        Object.defineProperty(globalThis, 'Buffer', bufferDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'Buffer');
      }
    }
  });

  it('leaves valid and undecodable text unchanged', () => {
    expect(repairMojibakeText('Thông báo lớp')).toBe('Thông báo lớp');
    expect(repairMojibakeText('Âm thanh')).toBe('Âm thanh');
    expect(repairMojibakeText('Ã')).toBe('Ã');
    expect(repairMojibakeText(null)).toBe('');
  });

  it('repairs text whose valid result still contains the Vietnamese letter Â', () => {
    expect(repairMojibakeText('Ã\u0082m thanh')).toBe('Âm thanh');
  });
});
