import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
const LOCATION_NOISE_MIN_METERS = 12;
const LOCATION_MAX_ACCURACY_METERS = 35;

export default function SosFullMapScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
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
  const viewerLocationRef = useRef<ViewerLocation>(null);
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
          setRouteInfo(
            formatRouteInfo(nextRoute) || formatFallbackRouteInfo(location, selectedRequest),
          );
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
        accuracy: Location.Accuracy.High,
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
      viewerLocationRef.current = initialLocation;
      scheduleRouteRefresh(initialLocation, true);

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 4_000,
        },
        (position) => {
          const rawLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: position.coords.accuracy ?? undefined,
          };
          const nextLocation = stabilizeViewerLocation(viewerLocationRef.current, rawLocation);
          if (!nextLocation) {
            return;
          }
          viewerLocationRef.current = nextLocation;
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
          routePolyline={extractRoutePolyline(routeData)}
          routeCoordinates={resolveRouteCoordinates(routeData, viewerLocation, selectedRequest)}
          height={null}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thoát bản đồ toàn màn hình"
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              top: Math.max(insets.top + 8, 16),
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
              right: 0,
              bottom: 0,
              left: 0,
              paddingTop: 16,
              paddingRight: 16,
              paddingBottom: Math.max(insets.bottom, 12) + 12,
              paddingLeft: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
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
  const distanceMeters =
    legs.reduce((sum, leg) => sum + Number(leg.distance?.value ?? 0), 0) ||
    Number(route.distance ?? 0);
  const durationSeconds =
    legs.reduce((sum, leg) => sum + Number(leg.duration?.value ?? 0), 0) ||
    Number(route.duration ?? 0);

  if (distanceMeters <= 0 && durationSeconds <= 0) {
    return 'Đã cập nhật lộ trình realtime.';
  }

  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `Lộ trình realtime: ${distanceKm} km · ${minutes} phút`;
}

function extractRoutePolyline(route: SosRouteData | null) {
  if (!route) {
    return null;
  }

  if (route.overview_polyline?.points) {
    return route.overview_polyline.points;
  }

  if (typeof route.geometry === 'string' && route.geometry.trim()) {
    return route.geometry;
  }

  if (route.geometry && typeof route.geometry === 'object' && route.geometry.points) {
    return route.geometry.points;
  }

  return null;
}

function formatFallbackRouteInfo(
  viewerLocation: ViewerLocation,
  selectedRequest: SosRequestRecord | null,
) {
  if (!viewerLocation || !selectedRequest) {
    return null;
  }

  const distanceMeters = getDistanceMeters(
    viewerLocation.lat,
    viewerLocation.lng,
    selectedRequest.lat,
    selectedRequest.lng,
  );

  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return 'Đang hiển thị đường nối trực tiếp tới điểm SOS.';
  }

  const distanceLabel =
    distanceMeters < 1000
      ? `${Math.max(1, Math.round(distanceMeters))} m`
      : `${(distanceMeters / 1000).toFixed(2)} km`;

  return `Đang hiển thị đường nối trực tiếp: ${distanceLabel}`;
}

function extractRouteCoordinates(route: SosRouteData | null): Array<[number, number]> | null {
  const geometry = route?.geometry;
  if (!geometry || typeof geometry !== 'object' || !Array.isArray(geometry.coordinates)) {
    return null;
  }

  const coordinates = geometry.coordinates
    .filter(
      (coord): coord is number[] =>
        Array.isArray(coord) &&
        coord.length >= 2 &&
        Number.isFinite(coord[0]) &&
        Number.isFinite(coord[1]),
    )
    .map((coord) => [Number(coord[0]), Number(coord[1])] as [number, number]);

  return coordinates.length ? coordinates : null;
}

function resolveRouteCoordinates(
  route: SosRouteData | null,
  viewerLocation: ViewerLocation,
  selectedRequest: SosRequestRecord | null,
): Array<[number, number]> | null {
  const extracted = extractRouteCoordinates(route);
  if (extracted?.length) {
    return extracted;
  }

  if (viewerLocation && selectedRequest) {
    return [
      [viewerLocation.lng, viewerLocation.lat],
      [selectedRequest.lng, selectedRequest.lat],
    ];
  }

  return null;
}

function stabilizeViewerLocation(
  previous: ViewerLocation,
  next: NonNullable<ViewerLocation>,
): ViewerLocation {
  const nextAccuracy = next.accuracyMeters ?? Number.POSITIVE_INFINITY;
  if (nextAccuracy > LOCATION_MAX_ACCURACY_METERS) {
    return previous;
  }

  if (!previous) {
    return next;
  }

  const previousAccuracy = previous.accuracyMeters ?? LOCATION_MAX_ACCURACY_METERS;
  const distanceMoved = getDistanceMeters(previous.lat, previous.lng, next.lat, next.lng);
  const noiseThreshold = Math.max(
    LOCATION_NOISE_MIN_METERS,
    Math.min(25, Math.min(previousAccuracy, nextAccuracy)),
  );

  if (distanceMoved < noiseThreshold && nextAccuracy >= previousAccuracy) {
    return previous;
  }

  if (distanceMoved < noiseThreshold * 2) {
    return {
      lat: (previous.lat + next.lat) / 2,
      lng: (previous.lng + next.lng) / 2,
      accuracyMeters: Math.min(previousAccuracy, nextAccuracy),
    };
  }

  return next;
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
    borderWidth: 1,
    borderRadius: 20,
    gap: 6,
  },
});
