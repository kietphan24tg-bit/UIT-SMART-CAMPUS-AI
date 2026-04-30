import { getAlertCategoryFromType, toNotificationFeed } from '../use-alert-feed';

describe('alert feed notification mapping', () => {
  it.each([
    ['grade_published', 'academic'],
    ['schedule_update', 'academic'],
    ['class_announcement', 'academic'],
    ['fire_alert', 'emergency'],
  ] as const)('maps %s to %s category', (type, category) => {
    expect(getAlertCategoryFromType(type)).toBe(category);
  });

  it('preserves academic notification metadata for display context', () => {
    const item = toNotificationFeed({
      id: 'notification-1',
      title: 'Điểm SE346 đã được cập nhật',
      body: 'Mobile: điểm tổng kết 8.',
      type: 'grade_published',
      isRead: false,
      createdAt: '2026-04-30T10:00:00.000Z',
      data: {
        classCode: 'SE346.Q21',
        courseCode: 'SE346',
        courseName: 'Lập trình trên thiết bị di động',
        room: 'B1.04',
        totalScore: 8,
      },
    });

    expect(item).toMatchObject({
      category: 'academic',
      severity: 'warning',
      classCode: 'SE346.Q21',
      courseCode: 'SE346',
      courseName: 'Lập trình trên thiết bị di động',
      room: 'B1.04',
      notificationContext: 'SE346.Q21 · SE346 · Phòng B1.04 · Điểm 8',
    });
  });
});
