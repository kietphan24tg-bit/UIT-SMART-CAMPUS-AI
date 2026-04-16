let lastToken: string | undefined;

export function stashAttendanceCheckinTokenForRetry(token: string) {
  lastToken = token;
}

export function peekAttendanceCheckinTokenForRetry(): string | undefined {
  return lastToken;
}

export function clearAttendanceCheckinRetryToken() {
  lastToken = undefined;
}
