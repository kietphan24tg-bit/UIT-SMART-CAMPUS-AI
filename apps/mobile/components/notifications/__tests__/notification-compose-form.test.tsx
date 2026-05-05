import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { NotificationComposeForm } from '../notification-compose-form';

describe('NotificationComposeForm', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates required admin fields before submitting', async () => {
    const onSubmit = jest.fn();
    const screen = render(<NotificationComposeForm mode="admin" onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('Gửi diện rộng'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Thiếu thông tin',
      'Nhập đầy đủ tiêu đề, nội dung và phạm vi nhận.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an admin role audience payload', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      count: 2,
      push: { targetTokens: 2, sent: 2, failed: 0, deactivatedTokens: 0 },
    });
    const screen = render(<NotificationComposeForm mode="admin" onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Nhắc lịch học bù'), 'Campus notice');
    fireEvent.changeText(
      screen.getByPlaceholderText('Nhập nội dung hiển thị trong ứng dụng và thông báo đẩy'),
      'Main gate closes at 10 PM',
    );
    fireEvent.press(screen.getByText('Theo vai trò'));
    fireEvent.press(screen.getByText('Giảng viên'));
    fireEvent.press(screen.getByText('Sinh viên'));
    fireEvent.press(screen.getByText('Gửi diện rộng'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Campus notice',
        body: 'Main gate closes at 10 PM',
        type: 'general',
        audience: { scope: 'roles', roles: ['lecturer'] },
      });
    });
  });

  it('shows a note when current user is outside the selected audience', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      count: 2,
      push: { targetTokens: 2, sent: 2, failed: 0, deactivatedTokens: 0 },
    });
    const screen = render(
      <NotificationComposeForm
        mode="admin"
        currentUserRole="admin"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(screen.getByText('Theo vai trò'));

    expect(
      screen.getByText(
        'Tài khoản hiện tại không nằm trong phạm vi đã chọn, nên tab Cảnh báo của bạn sẽ không có mục mới sau khi gửi.',
      ),
    ).toBeTruthy();
  });

  it('submits a lecturer class section payload', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      count: 1,
      push: { targetTokens: 1, sent: 1, failed: 0, deactivatedTokens: 0 },
    });
    const screen = render(
      <NotificationComposeForm
        mode="class"
        classSections={[
          {
            id: 'section-1',
            classCode: 'SE346.N11',
            sectionCode: 'N11',
            enrolledCount: 42,
            course: { code: 'SE346', name: 'Lập trình trên thiết bị di động' },
          },
        ]}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Nhắc lịch học bù'), 'Nhắc lịch học');
    fireEvent.changeText(
      screen.getByPlaceholderText('Nhập nội dung hiển thị trong ứng dụng và thông báo đẩy'),
      'Ngày mai học tại B201',
    );
    fireEvent.press(screen.getByText('Gửi cho lớp'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Nhắc lịch học',
        body: 'Ngày mai học tại B201',
        type: 'class_announcement',
        audience: { scope: 'class_section', classSectionId: 'section-1' },
      });
    });
  });
});
