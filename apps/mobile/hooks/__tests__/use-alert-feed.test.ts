import {
  getAlertCategoryFromType,
  toNotificationFeed,
} from '@/hooks/use-alert-feed';

describe('useAlertFeed helpers', () => {
  it('maps notification types to alert categories', () => {
    expect(getAlertCategoryFromType('academic.schedule')).toBe('academic');
    expect(getAlertCategoryFromType('payment.invoice')).toBe('payment');
    expect(getAlertCategoryFromType('fire.detected')).toBe('emergency');
    expect(getAlertCategoryFromType('system.notice')).toBe('general');
  });

  it('builds contextual metadata for schedule notifications', () => {
    const feed = toNotificationFeed({
      id: 'notif-1',
      title: 'Lich hoc thay doi',
      body: 'Phong hoc da cap nhat.',
      type: 'academic.schedule',
      createdAt: '2026-04-28T09:00:00.000Z',
      isRead: false,
      data: {
        classCode: 'SE346.Q21',
        courseCode: 'SE346',
        courseName: 'Lập trình trên thiết bị di động',
        room: 'B1.04',
        totalScore: 8,
      },
    });

    expect(feed.category).toBe('academic');
    expect(feed.courseName).toBe('Lập trình trên thiết bị di động');
    expect(feed.notificationContext).toBe('SE346.Q21 · SE346 · Phòng B1.04 · Điểm 8');
  });

  it('repairs mojibake notification copy from the API', () => {
    const mojibakeTitle = Buffer.from('Đơn canteen đã thanh toán', 'utf8').toString('latin1');
    const mojibakeBody = Buffer.from(
      'Thanh toán đơn hàng canteen thành công.',
      'utf8',
    ).toString('latin1');

    const feed = toNotificationFeed({
      id: 'notif-2',
      title: mojibakeTitle,
      body: mojibakeBody,
      type: 'payment.invoice',
      createdAt: '2026-05-01T11:27:00.000Z',
      isRead: false,
      data: {
        room: 'A1.01',
      },
    });

    expect(feed.title).toBe('Đơn canteen đã thanh toán');
    expect(feed.body).toBe('Thanh toán đơn hàng canteen thành công.');
    expect(feed.notificationContext).toBe('Phòng A1.01');
  });
});
