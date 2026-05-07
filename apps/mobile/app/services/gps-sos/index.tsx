import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { USER_ROLES } from '@smart-campus/shared';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { MetricGrid } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { sosApi, type SosRequestRecord } from '@/services/api/sos';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';

type ViewerLocation = {
  lat: number;
  lng: number;
  accuracyMeters?: number;
} | null;

export default function GpsSosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const [note, setNote] = useState('');
  const [viewerLocation, setViewerLocation] = useState<ViewerLocation>(null);
  const [routeNote, setRouteNote] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const activeQuery = useQuery({
    queryKey: ['sos', 'active'],
    queryFn: () => sosApi.listActive(),
    refetchInterval: 30_000,
  });
  const mineQuery = useQuery({
    queryKey: ['sos', 'mine'],
    queryFn: () => sosApi.listMine(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Ứng dụng chưa được cấp quyền vị trí để tạo SOS.');
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyMeters: position.coords.accuracy ?? undefined,
        note: note.trim() || undefined,
      };
      setViewerLocation({
        lat: payload.lat,
        lng: payload.lng,
        accuracyMeters: payload.accuracyMeters,
      });
      return sosApi.create(payload);
    },
    onSuccess: async () => {
      setNote('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sos', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['sos', 'mine'] }),
      ]);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (sosId: string) => sosApi.cancel(sosId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sos', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['sos', 'mine'] }),
      ]);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (sosId: string) => sosApi.resolve(sosId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sos', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['sos', 'mine'] }),
      ]);
    },
  });

  const routeMutation = useMutation({
    mutationFn: async (sosId: string) => {
      let location = viewerLocation;
      if (!location) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          throw new Error('Cần quyền vị trí để lấy lộ trình.');
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy ?? undefined,
        };
        setViewerLocation(location);
      }

      return sosApi.getRoute(sosId, location.lat, location.lng);
    },
    onSuccess: (payload) => {
      setRouteError(null);
      const route = (payload.route?.routes as Array<Record<string, unknown>> | undefined)?.[0];
      const distanceMeters = Number(route?.distance ?? 0);
      const durationSeconds = Number(route?.duration ?? 0);
      if (distanceMeters > 0 || durationSeconds > 0) {
        const distanceKm = (distanceMeters / 1000).toFixed(2);
        const minutes = Math.max(1, Math.round(durationSeconds / 60));
        setRouteNote(`Lộ trình ước tính: ${distanceKm} km · ${minutes} phút.`);
      } else {
        setRouteNote('Đã nhận lộ trình từ server.');
      }
    },
    onError: (error: unknown) => {
      setRouteNote(null);
      const message =
        (error as { message?: string })?.message ??
        'Không thể lấy lộ trình. Vui lòng thử lại.';
      setRouteError(message);
    },
  });

  const activeItems = activeQuery.data ?? [];
  const myLatestActive = mineQuery.data?.find((item) => item.status === 'active') ?? null;
  const metrics = [
    {
      label: 'SOS đang mở',
      value: `${activeItems.length}`,
      helper: 'Toàn bộ feed hiện tại',
      tone: 'danger' as const,
    },
    {
      label: 'SOS của tôi',
      value: `${mineQuery.data?.filter((item) => item.status === 'active').length ?? 0}`,
      helper: 'Yêu cầu còn hiệu lực',
      tone: 'warning' as const,
    },
    {
      label: 'Lần gần nhất',
      value: mineQuery.data?.[0] ? new Date(mineQuery.data[0].createdAt).toLocaleDateString('vi-VN') : '--',
      helper: 'Theo lịch sử cá nhân',
      tone: 'info' as const,
    },
    {
      label: 'Snapshot',
      value: '1 lần/bấm',
      helper: 'Không tracking realtime',
      tone: 'success' as const,
    },
  ];

  const markers = useMemo(
    () =>
      activeItems.map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        title: item.requester?.fullName ?? 'SOS',
      })),
    [activeItems],
  );

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="GPS/SOS"
        subtitle="Gửi SOS bằng vị trí snapshot và hỗ trợ theo feed cộng đồng."
        showBrand
        variant="accent"
      />

      <ContentStack overlapHero={false}>
        <MetricGrid items={metrics} layoutPreset="mobileTwoByTwo" compactColumns={2} cardMinHeight={112} />

        <SectionCard title="Kích hoạt SOS" subtitle="Lấy vị trí một lần khi bạn bấm gửi." variant="highlight" tone="academic">
          <View style={styles.stack}>
            <FormField
              label="Ghi chú SOS"
              value={note}
              onChangeText={setNote}
              placeholder="Mô tả ngắn tình huống cần hỗ trợ..."
            />
            {myLatestActive ? (
              <StatusBadge
                label={`Bạn đã có SOS đang mở · hết hạn ${new Date(myLatestActive.expiresAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}
                tone="warning"
              />
            ) : null}
            <PrimaryButton
              label="Gửi SOS ngay"
              loading={createMutation.isPending}
              disabled={Boolean(myLatestActive)}
              onPress={() => createMutation.mutate()}
            />
            {createMutation.isError ? (
              <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.medium }]}>
                {(createMutation.error as Error)?.message ?? 'Không thể tạo SOS'}
              </Text>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard title="Bản đồ SOS" subtitle="Điểm đánh dấu vị trí của các yêu cầu đang mở." variant="glass" tone="campus">
          <SosMap markers={markers} viewerLocation={viewerLocation} />
        </SectionCard>

        <SectionCard title="Bảng tin SOS đang mở" subtitle="Tất cả người dùng đăng nhập đều có thể xem." variant="outlined">
          {activeQuery.isLoading ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
              Đang tải feed SOS...
            </Text>
          ) : activeItems.length === 0 ? (
            <EmptyState icon="shield-checkmark-outline" title="Không có SOS đang mở" description="Bảng tin sẽ hiện khi có người dùng bấm SOS." />
          ) : (
            <View style={styles.stack}>
              {activeItems.map((item) => {
                const ownRequest = item.requesterId === userId;
                const canResolve = ownRequest || role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.sosCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                        {item.requester?.fullName ?? 'Người dùng cần hỗ trợ'}
                      </Text>
                      <StatusBadge label="Đang mở" tone="danger" size="sm" />
                    </View>
                    <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      {item.addressSnapshot || `${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`}
                    </Text>
                    <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Tạo lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </Text>
                    {item.note ? (
                      <Text style={[styles.body, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                        Ghi chú: {item.note}
                      </Text>
                    ) : null}
                    <View style={styles.row}>
                      <PrimaryButton
                        label="Mở lộ trình"
                        loading={routeMutation.isPending}
                        onPress={() => routeMutation.mutate(item.id)}
                      />
                      {ownRequest ? (
                        <PrimaryButton
                          label="Hủy SOS"
                          loading={cancelMutation.isPending}
                          onPress={() => cancelMutation.mutate(item.id)}
                        />
                      ) : null}
                      {canResolve ? (
                        <PrimaryButton
                          label="Kết thúc SOS"
                          loading={resolveMutation.isPending}
                          onPress={() => resolveMutation.mutate(item.id)}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })}
              {routeNote ? (
                <Text style={[styles.body, { color: theme.colors.primary, fontFamily: theme.fonts.medium }]}>
                  {routeNote}
                </Text>
              ) : null}
              {routeError ? (
                <Text style={[styles.errorText, { color: theme.colors.danger, fontFamily: theme.fonts.medium }]}>
                  {routeError}
                </Text>
              ) : null}
            </View>
          )}
        </SectionCard>

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
  );
}

function SosMap({
  markers,
  viewerLocation,
}: {
  markers: Array<{ id: string; lat: number; lng: number; title: string }>;
  viewerLocation: ViewerLocation;
}) {
  const theme = useAppTheme();
  const trackAsiaStyleUrl = process.env.EXPO_PUBLIC_TRACK_ASIA_STYLE_URL;
  const html = createMapHtml({
    markers,
    viewerLocation,
    isDark: theme.isDark,
    trackAsiaStyleUrl,
  });

  return (
    <View
      style={[
        styles.mapWrap,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceSubtle,
        },
      ]}
    >
      <WebView source={{ html }} style={styles.mapWebView} />
    </View>
  );
}

function createMapHtml({
  markers,
  viewerLocation,
  isDark,
  trackAsiaStyleUrl,
}: {
  markers: Array<{ id: string; lat: number; lng: number; title: string }>;
  viewerLocation: ViewerLocation;
  isDark: boolean;
  trackAsiaStyleUrl?: string;
}) {
  const payload = JSON.stringify({
    markers,
    viewerLocation,
  });
  const tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const textColor = isDark ? '#E2E8F0' : '#0F172A';
  const bgColor = isDark ? '#0B1220' : '#F8FAFC';

  if (trackAsiaStyleUrl?.trim()) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
    <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${bgColor}; color: ${textColor}; }
      .marker-dot {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        border: 2px solid #fff;
        background: #EF4444;
      }
      .viewer-dot {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        border: 2px solid #fff;
        background: #2563EB;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const payload = ${payload};
      const fallbackCenter = [106.8034, 10.8702];
      const first = payload.markers[0];
      const center = first ? [first.lng, first.lat] : fallbackCenter;
      const map = new maplibregl.Map({
        container: 'map',
        style: '${trackAsiaStyleUrl}',
        center,
        zoom: first ? 15 : 13,
      });
      const bounds = new maplibregl.LngLatBounds();
      let hasBounds = false;

      payload.markers.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'marker-dot';
        new maplibregl.Marker({ element: el })
          .setLngLat([item.lng, item.lat])
          .setPopup(new maplibregl.Popup({ offset: 20 }).setText(item.title || 'SOS'))
          .addTo(map);
        bounds.extend([item.lng, item.lat]);
        hasBounds = true;
      });

      if (payload.viewerLocation) {
        const viewer = document.createElement('div');
        viewer.className = 'viewer-dot';
        new maplibregl.Marker({ element: viewer })
          .setLngLat([payload.viewerLocation.lng, payload.viewerLocation.lat])
          .setPopup(new maplibregl.Popup({ offset: 20 }).setText('Vị trí của bạn'))
          .addTo(map);
        bounds.extend([payload.viewerLocation.lng, payload.viewerLocation.lat]);
        hasBounds = true;
      }

      map.on('load', () => {
        if (hasBounds) {
          map.fitBounds(bounds, { padding: 32, duration: 0, maxZoom: 16 });
        }
      });
    </script>
  </body>
  </html>
  `;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${bgColor}; color: ${textColor}; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const payload = ${payload};
      const fallbackCenter = [10.8702, 106.8034];
      const first = payload.markers[0];
      const center = first ? [first.lat, first.lng] : fallbackCenter;
      const map = L.map('map').setView(center, first ? 15 : 13);
      L.tileLayer('${tileLayer}', { maxZoom: 19 }).addTo(map);

      const points = [];
      payload.markers.forEach((item) => {
        const marker = L.marker([item.lat, item.lng]).addTo(map);
        marker.bindPopup(item.title || 'SOS');
        points.push([item.lat, item.lng]);
      });

      if (payload.viewerLocation) {
        const viewer = L.circleMarker([payload.viewerLocation.lat, payload.viewerLocation.lng], {
          radius: 7,
          color: '#2563EB',
          fillColor: '#2563EB',
          fillOpacity: 0.85,
        }).addTo(map);
        viewer.bindPopup('Vị trí của bạn');
        points.push([payload.viewerLocation.lat, payload.viewerLocation.lng]);
      }

      if (points.length > 1) {
        map.fitBounds(points, { padding: [20, 20] });
      }
    </script>
  </body>
  </html>
  `;
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },
  sosCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  mapWrap: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
  },
  mapWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
