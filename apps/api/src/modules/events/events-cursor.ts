import { BadRequestException } from '@nestjs/common';

interface CursorPayload {
  o: number;
}

export function encodeEventsCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset } satisfies CursorPayload), 'utf8').toString(
    'base64url',
  );
}

export function decodeEventsCursor(cursor: string): number {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as CursorPayload;
    if (typeof parsed.o !== 'number' || !Number.isFinite(parsed.o) || parsed.o < 0) {
      throw new Error('invalid');
    }
    return Math.floor(parsed.o);
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}
