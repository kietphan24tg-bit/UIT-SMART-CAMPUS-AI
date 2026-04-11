export const MAX_AVATAR_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
