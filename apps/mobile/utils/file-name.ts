const ENCODED_SEGMENT_PATTERN = /%[0-9A-Fa-f]{2}/;

function decodeOnce(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function decodeDisplayFileName(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '';
  }

  let current = trimmed;
  for (let attempt = 0; attempt < 3 && ENCODED_SEGMENT_PATTERN.test(current); attempt += 1) {
    const decoded = decodeOnce(current).trim();
    if (!decoded || decoded === current) {
      break;
    }
    current = decoded;
  }

  return current;
}
