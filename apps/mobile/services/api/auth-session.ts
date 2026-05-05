type AuthSessionHandlers = {
  onAccessTokenUpdated?: (accessToken: string) => void;
  onSessionInvalidated?: () => void;
};

let handlers: AuthSessionHandlers = {};

export function registerAuthSessionHandlers(nextHandlers: AuthSessionHandlers) {
  handlers = nextHandlers;
}

export function notifyAccessTokenUpdated(accessToken: string) {
  handlers.onAccessTokenUpdated?.(accessToken);
}

export function notifySessionInvalidated() {
  handlers.onSessionInvalidated?.();
}
