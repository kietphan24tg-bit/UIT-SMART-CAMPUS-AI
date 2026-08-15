import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import {
  configureForegroundNotificationHandler,
  flushPendingNotificationNavigation,
  subscribePushNotificationEvents,
} from '../push-receiver';

import { useAuthStore } from '@/stores/auth-store';

describe('push receiver', () => {
  const queryClient = {
    invalidateQueries: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: true, isHydrated: true });
  });

  it('does not initialize native notification APIs on web', () => {
    const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });

    try {
      const unsubscribe = subscribePushNotificationEvents(queryClient as never);
      configureForegroundNotificationHandler();

      expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).not.toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
      expect(unsubscribe()).toBeUndefined();
    } finally {
      if (platformDescriptor) {
        Object.defineProperty(Platform, 'OS', platformDescriptor);
      }
    }
  });

  it('configures foreground notification display behavior', async () => {
    configureForegroundNotificationHandler();

    expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
      handleNotification: expect.any(Function),
    });

    const handler = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];
    await expect(handler.handleNotification()).resolves.toEqual({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
  });

  it('invalidates notification queries when a foreground notification is received', () => {
    subscribePushNotificationEvents(queryClient as never);

    const onReceived = (Notifications.addNotificationReceivedListener as jest.Mock).mock
      .calls[0][0];
    onReceived();

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['alert-feed'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('navigates to notification detail when user presses a push notification', () => {
    subscribePushNotificationEvents(queryClient as never);

    const onResponse = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock
      .calls[0][0];
    onResponse({
      notification: {
        request: {
          content: {
            data: {
              kind: 'notification',
              notificationId: 'notif-1',
            },
          },
        },
      },
    });

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/alerts/[id]',
      params: { id: 'notif-1', kind: 'notification' },
    });
  });

  it('queues push navigation until the user is authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false, isHydrated: true });
    subscribePushNotificationEvents(queryClient as never);

    const onResponse = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock
      .calls[0][0];
    onResponse({
      notification: {
        request: {
          content: {
            data: {
              kind: 'notification',
              notificationId: 'notif-2',
            },
          },
        },
      },
    });

    expect(router.push).not.toHaveBeenCalled();

    useAuthStore.setState({ isAuthenticated: true, isHydrated: true });
    flushPendingNotificationNavigation();

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/alerts/[id]',
      params: { id: 'notif-2', kind: 'notification' },
    });
  });
});
