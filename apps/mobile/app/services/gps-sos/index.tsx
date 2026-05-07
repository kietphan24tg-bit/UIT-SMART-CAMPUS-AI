import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { USER_ROLES } from '@smart-campus/shared';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SosMap } from '@/components/maps/sos-map';
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
import { sosApi } from '@/services/api/sos';
import { useAuthStore } from '@/stores/auth-store';
import { useSosRealtimeStore } from '@/stores/sos-realtime-store';
import { useAppTheme } from '@/theme';

type ViewerLocation = {
  lat: number;
  lng: number;
  accuracyMeters?: number;
} | null;

const SOS_FALLBACK_REFETCH_MS = 120_000;

export default function GpsSosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const connectionState = useSosRealtimeStore((state) => state.connectionState);
  const [note, setNote] = useState('');
  const [viewerLocation, setViewerLocation] = useState<ViewerLocation>(null);

  const activeQuery = useQuery({
    queryKey: ['sos', 'active'],
    queryFn: () => sosApi.listActive(),
    refetchInterval: SOS_FALLBACK_REFETCH_MS,
  });
  const mineQuery = useQuery({
    queryKey: ['sos', 'mine'],
    queryFn: () => sosApi.listMine(),
    refetchInterval: SOS_FALLBACK_REFETCH_MS,
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
      value: mineQuery.data?.[0]
        ? new Date(mineQuery.data[0].createdAt).toLocaleDateString('vi-VN')
        : '--',
      helper: 'Theo lịch sử cá nhân',
      tone: 'info' as const,
    },
    {
      label: 'Realtime feed',
      value: connectionState === 'live' ? 'Đang live' : 'Dự phòng',
      helper: connectionState === 'live' ? 'Socket đang kết nối' : 'Socket tạm gián đoạn',
      tone: connectionState === 'live' ? ('success' as const) : ('warning' as const),
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

  const openFullscreenMap = (sosId?: string) => {
    if (sosId) {
      router.push({
        pathname: '/services/gps-sos/map',
        params: { sosId },
      } as never);
      return;
    }

    router.push('/services/gps-sos/map' as never);
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="GPS/SOS"
        subtitle="Người tạo SOS gửi snapshot vị trí, còn người hỗ trợ có thể mở lộ trình realtime toàn màn hình."
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

        <SectionCard
          title="Bản đồ SOS"
          subtitle="Chạm vào bản đồ để mở toàn màn hình và xem vị trí hỗ trợ rõ hơn."
          variant="glass"
          tone="campus"
        >
          <SosMap markers={markers} viewerLocation={viewerLocation} onPress={() => openFullscreenMap()} />
        </SectionCard>

        <SectionCard title="Bảng tin SOS đang mở" subtitle="Mọi người dùng đăng nhập đều có thể xem feed hỗ trợ." variant="outlined">
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
                      <PrimaryButton label="Mở lộ trình" onPress={() => openFullscreenMap(item.id)} />
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
            </View>
          )}
        </SectionCard>

        <PrimaryButton label="Quay lại dịch vụ" onPress={() => router.replace('/services')} />
      </ContentStack>
    </Screen>
  );
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
});
