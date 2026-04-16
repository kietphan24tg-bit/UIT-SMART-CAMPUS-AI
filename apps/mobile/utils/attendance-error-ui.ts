export type AttendanceErrorCode =
  | 'TOKEN_INVALID'
  | 'TOKEN_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SESSION_CLOSED'
  | 'ALREADY_CHECKED_IN'
  | 'NETWORK'
  | 'UNKNOWN';

export type AttendanceErrorUi = {
  code: AttendanceErrorCode;
  recoverable: boolean;
  title: string;
  message: string;
};

type ApiLikeError = {
  statusCode?: number;
  code?: string;
  message?: string;
};

function normalizeCode(raw: string | undefined, statusCode: number | undefined): AttendanceErrorCode {
  if (
    raw === 'TOKEN_INVALID' ||
    raw === 'TOKEN_NOT_FOUND' ||
    raw === 'RATE_LIMITED' ||
    raw === 'SESSION_CLOSED' ||
    raw === 'ALREADY_CHECKED_IN' ||
    raw === 'NETWORK'
  ) {
    return raw;
  }
  if (statusCode === 429) {
    return 'RATE_LIMITED';
  }
  if (statusCode === 409) {
    return 'ALREADY_CHECKED_IN';
  }
  return 'UNKNOWN';
}

function readStringMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message;
    return typeof m === 'string' ? m : undefined;
  }
  return undefined;
}

export function mapAttendanceErrorToUi(err: unknown): AttendanceErrorUi {
  const looseMessage = readStringMessage(err);
  if (
    looseMessage?.toLowerCase().includes('không tìm thấy mã') ||
    looseMessage?.toLowerCase().includes('khong tim thay ma') ||
    looseMessage?.toLowerCase().includes('token not found')
  ) {
    return {
      code: 'TOKEN_NOT_FOUND',
      recoverable: true,
      title: 'Không nhận được mã QR',
      message: 'Đưa mã vào đúng khung quét và thử lại.',
    };
  }
  if (looseMessage === 'Network Error' || looseMessage?.toLowerCase().includes('network')) {
    return {
      code: 'NETWORK',
      recoverable: true,
      title: 'Không kết nối được',
      message: 'Kiểm tra mạng và thử lại.',
    };
  }

  const body = err as ApiLikeError;
  const statusCode = typeof body?.statusCode === 'number' ? body.statusCode : undefined;
  const code = normalizeCode(typeof body?.code === 'string' ? body.code : undefined, statusCode);

  switch (code) {
    case 'TOKEN_INVALID':
      return {
        code,
        recoverable: true,
        title: 'Mã QR đã hết hạn',
        message:
          'Mã QR đã hết hạn hoặc không hợp lệ. Hãy quét mã mới trên màn hình lớp.',
      };
    case 'TOKEN_NOT_FOUND':
      return {
        code,
        recoverable: true,
        title: 'Không nhận được mã QR',
        message: 'Đưa mã vào đúng khung quét và thử lại.',
      };
    case 'RATE_LIMITED':
      return {
        code,
        recoverable: true,
        title: 'Thao tác quá nhanh',
        message: 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau vài giây.',
      };
    case 'SESSION_CLOSED':
      return {
        code,
        recoverable: false,
        title: 'Buổi điểm danh đã kết thúc',
        message: 'Giảng viên đã đóng phiên điểm danh hoặc phiên đã hết hạn. Liên hệ giảng viên nếu cần hỗ trợ.',
      };
    case 'ALREADY_CHECKED_IN':
      return {
        code,
        recoverable: false,
        title: 'Đã điểm danh rồi',
        message:
          typeof body?.message === 'string' && body.message.length > 0
            ? body.message
            : 'Bạn đã điểm danh cho buổi học này rồi. Không cần thực hiện lại.',
      };
    default:
      if (statusCode != null && statusCode >= 500) {
        return {
          code: 'UNKNOWN',
          recoverable: true,
          title: 'Lỗi máy chủ',
          message: 'Hệ thống đang bận. Vui lòng thử lại sau.',
        };
      }
      return {
        code: 'UNKNOWN',
        recoverable: true,
        title: 'Không điểm danh được',
        message:
          typeof body?.message === 'string' && body.message.length > 0
            ? body.message
            : 'Đã xảy ra lỗi. Vui lòng thử lại.',
      };
  }
}
