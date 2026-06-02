export const MAX_AVATAR_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const ALLOWED_STUDY_MATERIAL_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['application/pdf', 'pdf'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
]);
