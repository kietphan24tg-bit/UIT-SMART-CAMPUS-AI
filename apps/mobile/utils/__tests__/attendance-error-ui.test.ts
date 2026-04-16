import { mapAttendanceErrorToUi } from '../attendance-error-ui';

describe('mapAttendanceErrorToUi', () => {
  it('maps TOKEN_INVALID as recoverable', () => {
    const ui = mapAttendanceErrorToUi({ code: 'TOKEN_INVALID', statusCode: 400 });
    expect(ui.recoverable).toBe(true);
    expect(ui.title).toContain('hết hạn');
  });

  it('maps RATE_LIMITED via status 429', () => {
    const ui = mapAttendanceErrorToUi({ code: 'RATE_LIMITED', statusCode: 429 });
    expect(ui.recoverable).toBe(true);
    expect(ui.code).toBe('RATE_LIMITED');
  });

  it('maps SESSION_CLOSED as non-recoverable', () => {
    const ui = mapAttendanceErrorToUi({ code: 'SESSION_CLOSED', statusCode: 400 });
    expect(ui.recoverable).toBe(false);
  });

  it('maps ALREADY_CHECKED_IN as non-recoverable', () => {
    const ui = mapAttendanceErrorToUi({
      code: 'ALREADY_CHECKED_IN',
      statusCode: 409,
      message: 'Already there',
    });
    expect(ui.recoverable).toBe(false);
    expect(ui.message).toBe('Already there');
  });
});
