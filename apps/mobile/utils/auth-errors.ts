export const REGISTRATION_SESSION_SETUP_ERROR_CODE = 'REGISTRATION_SESSION_SETUP_FAILED';

type RegistrationSessionSetupError = Error & {
  appCode: typeof REGISTRATION_SESSION_SETUP_ERROR_CODE;
};

export function createRegistrationSessionSetupError(): RegistrationSessionSetupError {
  const error = new Error(
    'Email đã được xác thực và tài khoản đã được tạo, nhưng chưa thể hoàn tất phiên đăng nhập.',
  ) as RegistrationSessionSetupError;
  error.name = 'RegistrationSessionSetupError';
  error.appCode = REGISTRATION_SESSION_SETUP_ERROR_CODE;
  return error;
}

export function isRegistrationSessionSetupError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'appCode' in error &&
    (error as { appCode?: unknown }).appCode === REGISTRATION_SESSION_SETUP_ERROR_CODE
  );
}
