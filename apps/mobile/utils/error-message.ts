const EXACT_ERROR_MESSAGE_MAP: Record<string, string> = {
  'Invalid credentials': 'Email hoặc mật khẩu chưa đúng.',
  'Invalid refresh token': 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  'Unable to send OTP at the moment': 'Không thể gửi OTP lúc này.',
  'Invalid or expired OTP': 'OTP không hợp lệ hoặc đã hết hạn.',
  'Current password is incorrect': 'Mật khẩu hiện tại chưa đúng.',
  'Email already exists': 'Email đã được đăng ký.',
  'Student ID already exists': 'MSSV đã được đăng ký.',
  'Internal server error': 'Hệ thống đang bận. Vui lòng thử lại sau.',
  'email must be an email': 'Email không đúng định dạng.',
  'password must be longer than or equal to 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'newPassword must be longer than or equal to 8 characters':
    'Mật khẩu phải có ít nhất 8 ký tự.',
  'Password must contain at least 1 uppercase letter and 1 number':
    'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa và 1 chữ số.',
  'Student ID must be 8 digits': 'Mã số sinh viên phải gồm đúng 8 chữ số.',
  'OTP must be 6 digits': 'OTP phải gồm đúng 6 chữ số.',
  'Attendance token is invalid or expired': 'Mã điểm danh không hợp lệ hoặc đã hết hạn.',
  'Attendance token is invalid': 'Mã điểm danh không hợp lệ.',
  'Student is not enrolled in this class section': 'Sinh viên chưa đăng ký lớp học phần này.',
  'Student has already checked in for this session': 'Sinh viên đã điểm danh cho buổi học này.',
  'Too many check-in requests. Please try again shortly.':
    'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  'Attendance session is closed': 'Phiên điểm danh đã đóng.',
  'Attendance session has expired': 'Phiên điểm danh đã hết hạn.',
  'Attendance session not found': 'Không tìm thấy phiên điểm danh.',
  'Invalid displayKey': 'Mã hiển thị không hợp lệ.',
  'Mock events mode is disabled for this demo build':
    'Chế độ dữ liệu mẫu cho sự kiện không khả dụng trong bản dựng này.',
  'Mock room-bookings mode is disabled for this demo build':
    'Chế độ dữ liệu mẫu cho đặt phòng không khả dụng trong bản dựng này.',
  'Notification permission was not granted on this device.':
    'Thiết bị chưa cấp quyền nhận thông báo.',
  'Unable to refresh access token during hydrate':
    'Không thể khôi phục phiên đăng nhập. Vui lòng đăng nhập lại.',
  'undefined is not a function':
    'Thiết bị không hỗ trợ thao tác này. Vui lòng thử lại hoặc chọn ảnh khác.',
};

const PARTIAL_ERROR_MESSAGE_MAP: Array<[string, string]> = [
  ['undefined is not a function', 'Thiết bị không hỗ trợ thao tác này. Vui lòng thử lại hoặc chọn ảnh khác.'],
  ['must be an email', 'Email không đúng định dạng.'],
  ['must be longer than or equal to 8 characters', 'Mật khẩu phải có ít nhất 8 ký tự.'],
  ['must match /^\\d{6}$/', 'OTP phải gồm đúng 6 chữ số.'],
  ['must match /^\\d{8}$/', 'Mã số sinh viên phải gồm đúng 8 chữ số.'],
  ['network error', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.'],
  ['request failed with status 400', 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.'],
  ['request failed with status 401', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'],
  ['request failed with status 403', 'Bạn không có quyền thực hiện thao tác này.'],
  ['request failed with status 404', 'Không tìm thấy dữ liệu yêu cầu.'],
  ['request failed with status 409', 'Dữ liệu bị xung đột. Vui lòng tải lại và thử lại.'],
  ['request failed with status 413', 'Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn.'],
  ['request failed with status 422', 'Dữ liệu nhập vào chưa hợp lệ. Vui lòng kiểm tra lại.'],
  ['request failed with status 429', 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'],
  ['request failed with status 500', 'Hệ thống đang bận. Vui lòng thử lại sau.'],
  ['email already exists', 'Email đã được đăng ký.'],
  ['student id already exists', 'MSSV đã được đăng ký.'],
  ['internal server error', 'Hệ thống đang bận. Vui lòng thử lại sau.'],
  ['only jpeg', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'],
  ['only jpg', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'],
  ['5 mb or smaller', 'Ảnh tải lên phải nhỏ hơn 5 MB.'],
  ['file too large', 'Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn.'],
];

export function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === 'object' && error !== null) {
    const errorRecord = error as {
      message?: unknown;
      error?: { message?: unknown } | unknown;
    };

    if (typeof errorRecord.message === 'string' && errorRecord.message.trim()) {
      return errorRecord.message.trim();
    }

    if (Array.isArray(errorRecord.message)) {
      const firstMessage = errorRecord.message.find(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );

      if (firstMessage) {
        return firstMessage.trim();
      }
    }

    if (
      errorRecord.error &&
      typeof errorRecord.error === 'object' &&
      'message' in errorRecord.error &&
      typeof errorRecord.error.message === 'string' &&
      errorRecord.error.message.trim()
    ) {
      return errorRecord.error.message.trim();
    }
  }

  return null;
}

export function localizeErrorMessage(message: string) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return trimmedMessage;
  }

  const exactMatch = EXACT_ERROR_MESSAGE_MAP[trimmedMessage];
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedMessage = trimmedMessage.toLowerCase();
  const partialMatch = PARTIAL_ERROR_MESSAGE_MAP.find(([pattern]) =>
    normalizedMessage.includes(pattern),
  );

  return partialMatch?.[1] ?? trimmedMessage;
}

export function getLocalizedErrorMessage(error: unknown, fallback: string) {
  const message = extractErrorMessage(error);
  if (!message) {
    return fallback;
  }

  const localized = localizeErrorMessage(message);
  return localized || fallback;
}

export function createLocalizedError(error: unknown, fallback: string) {
  return new Error(getLocalizedErrorMessage(error, fallback));
}
