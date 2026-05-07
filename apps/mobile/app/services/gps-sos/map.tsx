import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SosMap } from '@/components/maps/sos-map';
import { Screen } from '@/components/ui';
import { sosApi, type SosRequestRecord, type SosRouteData } from '@/services/api/sos';
import { useSosRealtimeStore } from '@/stores/sos-realtime-store';
import { useAppTheme } from '@/theme';

type ViewerLocation = {
  lat: number;
  lng: number;
  accuracyMeters?: number;
} | null;

const ROUTE_REFRESH_MIN_MS = 8_000;
const ROUTE_REFRESH_DISTANCE_METERS = 20;

export default function SosFullMapScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { sosId } = useLocalSearchParams<{ sosId?: string }>();
  const latestEvent = useSosRealtimeStore((state) =>
    sosId ? state.eventsById[sosId] : undefined,
  );
  const connectionState = useSosRealtimeStore((state) => state.connectionState);
  const [viewerLocation, setViewerLocation] = useState<ViewerLocation>(null);
  const [routeData, setRouteData] = useState<SosRouteData | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<string | null>(null);
  const [sosStatusLabel, setSosStatusLabel] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRouteRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const lastFetchLocationRef = useRef<ViewerLocation>(null);

  const activeQuery = useQuery({
    queryKey: ['sos', 'active'],
    queryFn: () => sosApi.listActive(),
    refetchInterval: 120_000,
  });

  const selectedRequest =
    (sosId
      ? activeQuery.data?.find((item) => item.id === sosId)
      : activeQuery.data?.[0]) ?? latestEvent?.request ?? null;

  useEffect(() => {
    if (!latestEvent?.request || latestEvent.request.status === 'active') {
      return;
    }

    const labelByStatus: Record<string, string> = {
      cancelled: 'SOS này đã được hủy. Bạn không cần tiếp tục đến điểm này.',
      resolved: 'SOS này đã được kết thúc. Lộ trình đã được khóa.',
      expired: 'SOS này đã hết hiệu lực. Lộ trình đã được khóa.',
    };
    setSosStatusLabel(labelByStatus[latestEvent.request.status] ?? 'SOS này không còn hoạt động.');
  }, [latestEvent]);

  useEffect(() => {
    let isCancelled = false;

    const scheduleRouteRefresh = (location: ViewerLocation, force = false) => {
      if (!sosId || !location || !selectedRequest || selectedRequest.status !== 'active') {
        return;
      }

      const now = Date.now();
      const lastLocation = lastFetchLocationRef.current;
      const distanceMoved = lastLocation
        ? getDistanceMeters(lastLocation.lat, lastLocation.lng, location.lat, location.lng)
        : Number.POSITIVE_INFINITY;
      const timeElapsed = now - lastFetchAtRef.current;

      if (!force && distanceMoved < ROUTE_REFRESH_DISTANCE_METERS && timeElapsed < ROUTE_REFRESH_MIN_MS) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          scheduleRouteRefresh(location, true);
        }, Math.max(1_000, ROUTE_REFRESH_MIN_MS - timeElapsed));
        return;
      }

      if (isFetchingRouteRef.current) {
        return;
      }

      isFetchingRouteRef.current = true;
      lastFetchAtRef.current = now;
      lastFetchLocationRef.current = location;
      setRouteError(null);

      void sosApi
        .getRoute(sosId, location.lat, location.lng)
        .then((payload) => {
          if (isCancelled) {
            return;
          }
          const nextRoute = payload.route.routes?.[0] ?? null;
          setRouteData(nextRoute);
          setRouteInfo(formatRouteInfo(nextRoute));
        })
        .catch((error: unknown) => {
          if (isCancelled) {
            return;
          }
          setRouteData(null);
          setRouteInfo(null);
          setRouteError(
            (error as { message?: string })?.message ?? 'Không thể lấy lộ trình. Vui lòng thử lại.',
          );
        })
        .finally(() => {
          isFetchingRouteRef.current = false;
        });
    };

    const startWatching = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setRouteError('Cần quyền vị trí để theo dõi lộ trình realtime.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const initialLocation = {
        lat: current.coords.latitude,
        lng: current.coords.longitude,
        accuracyMeters: current.coords.accuracy ?? undefined,
      };
      if (isCancelled) {
        return;
      }
      setViewerLocation(initialLocation);
      scheduleRouteRefresh(initialLocation, true);

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
          timeInterval: 5_000,
        },
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: position.coords.accuracy ?? undefined,
          };
          setViewerLocation(nextLocation);
          scheduleRouteRefresh(nextLocation);
        },
      );
    };

    void startWatching();

    return () => {
      isCancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [selectedRequest, sosId]);

  const markers = selectedRequest
    ? [
        {
          id: selectedRequest.id,
          lat: selectedRequest.lat,
          lng: selectedRequest.lng,
          title: selectedRequest.requester?.fullName ?? 'SOS',
        },
      ]
    : (activeQuery.data ?? []).map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        title: item.requester?.fullName ?? 'SOS',
      }));

  return (
    <Screen scroll={false} variant="fullBleed">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SosMap
          markers={markers}
          viewerLocation={viewerLocation}
          routePolyline={routeData?.overview_polyline?.points ?? null}
          height={null}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thoát bản đồ toàn màn hình"
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: 18 }}>
            ←
          </Text>
        </Pressable>

        <View
          style={[
            styles.infoPanel,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: 16 }}>
            {selectedRequest?.requester?.fullName ?? 'Bản đồ SOS'}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.regular, fontSize: 13 }}>
            {selectedRequest?.addressSnapshot ||
              (selectedRequest
                ? `${selectedRequest.lat.toFixed(6)}, ${selectedRequest.lng.toFixed(6)}`
                : 'Đang hiển thị toàn bộ SOS đang mở')}
          </Text>
          {routeInfo ? (
            <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 13 }}>
              {routeInfo}
            </Text>
          ) : null}
          {routeError ? (
            <Text style={{ color: theme.colors.danger, fontFamily: theme.fonts.medium, fontSize: 13 }}>
              {routeError}
            </Text>
          ) : null}
          {sosStatusLabel ? (
            <Text style={{ color: theme.colors.warning, fontFamily: theme.fonts.medium, fontSize: 13 }}>
              {sosStatusLabel}
            </Text>
          ) : null}
          <Text style={{ color: theme.colors.textSoft, fontFamily: theme.fonts.regular, fontSize: 12 }}>
            Realtime SOS: {connectionState === 'live' ? 'đang kết nối' : 'đang dự phòng'}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function formatRouteInfo(route: SosRouteData | null) {
  if (!route) {
    return null;
  }

  const legs = route.legs ?? [];
  const distanceMeters = legs.reduce((sum, leg) => sum + Number(leg.distance?.value ?? 0), 0);
  const durationSeconds = legs.reduce((sum, leg) => sum + Number(leg.duration?.value ?? 0), 0);

  if (distanceMeters <= 0 && durationSeconds <= 0) {
    return 'Đã cập nhật lộ trình realtime.';
  }

  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `Lộ trình realtime: ${distanceKm} km · ${minutes} phút`;
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPanel: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    left: 16,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
});
