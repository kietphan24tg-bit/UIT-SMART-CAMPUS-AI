import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import RenderHTML, { defaultSystemFonts } from 'react-native-render-html';

import {
  ContentStack,
  EmptyState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SkeletonBlock,
} from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { eventsApi } from '@/services/api/events';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';

const UIT_ORIGIN = 'https://www.uit.edu.vn';

export default function EventDetailScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const contentWidth = Math.max(layout.availableWidth, 0);

  const detailQuery = useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => eventsApi.detail(slug),
    enabled: slug.length > 0,
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.register(eventId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'detail', slug] }),
      ]);
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.unregister(eventId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'detail', slug] }),
      ]);
    },
  });

  return (
    <Screen>
      <ContentStack gap={18} overlapHero={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách sự kiện"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backPill,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          <Text style={[styles.backLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
            Sự kiện
          </Text>
        </Pressable>

        {detailQuery.isLoading ? <DetailSkeleton /> : null}

        {!detailQuery.isLoading && detailQuery.isError ? (
          <EmptyState
            icon="document-text-outline"
            title="Chưa tải được bài viết"
            description="Bài viết có thể tạm thời không khả dụng. Vui lòng thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void detailQuery.refetch()}
          />
        ) : null}

        {!detailQuery.isLoading && !detailQuery.isError && detailQuery.data ? (
          <View style={styles.article}>
            <View style={styles.articleHeader}>
              <Text style={[styles.articleTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
                {detailQuery.data.title}
              </Text>
              {detailQuery.data.publishedAtLabel ? (
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} />
                  <Text style={[styles.dateLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                    {detailQuery.data.publishedAtLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: detailQuery.data.contentHtml, baseUrl: UIT_ORIGIN }}
              systemFonts={[...defaultSystemFonts, theme.fonts.regular, theme.fonts.medium, theme.fonts.bold]}
              baseStyle={{
                color: theme.colors.text,
                fontFamily: theme.fonts.regular,
                fontSize: 16,
                lineHeight: 25,
              }}
              tagsStyles={{
                body: {
                  color: theme.colors.text,
                  margin: 0,
                },
                p: {
                  marginTop: 0,
                  marginBottom: 14,
                },
                h1: {
                  color: theme.colors.text,
                  fontFamily: theme.fonts.bold,
                  fontSize: 24,
                  lineHeight: 31,
                  marginTop: 18,
                  marginBottom: 10,
                },
                h2: {
                  color: theme.colors.text,
                  fontFamily: theme.fonts.bold,
                  fontSize: 21,
                  lineHeight: 28,
                  marginTop: 18,
                  marginBottom: 10,
                },
                h3: {
                  color: theme.colors.text,
                  fontFamily: theme.fonts.bold,
                  fontSize: 18,
                  lineHeight: 25,
                  marginTop: 16,
                  marginBottom: 8,
                },
                a: {
                  color: theme.colors.primary,
                  textDecorationLine: 'underline',
                },
                img: {
                  maxWidth: contentWidth,
                  borderRadius: 10,
                  marginTop: 8,
                  marginBottom: 16,
                },
                ul: {
                  marginTop: 0,
                  marginBottom: 14,
                },
                ol: {
                  marginTop: 0,
                  marginBottom: 14,
                },
                li: {
                  marginBottom: 8,
                },
                table: {
                  maxWidth: contentWidth,
                },
                th: {
                  color: theme.colors.text,
                  fontFamily: theme.fonts.bold,
                },
                td: {
                  color: theme.colors.text,
                },
              }}
              renderersProps={{
                a: {
                  onPress: (_event, href) => {
                    if (href) {
                      void Linking.openURL(href);
                    }
                  },
                },
              }}
            />

            {detailQuery.data.status === 'open' && role === USER_ROLES.STUDENT ? (
              detailQuery.data.isRegistered ? (
                <SecondaryButton
                  label={unregisterMutation.isPending ? 'Đang hủy đăng ký...' : 'Hủy đăng ký tham gia'}
                  onPress={() => {
                    if (detailQuery.data?.id) {
                      unregisterMutation.mutate(detailQuery.data.id);
                    }
                  }}
                  disabled={registerMutation.isPending || unregisterMutation.isPending}
                />
              ) : (
                <PrimaryButton
                  label={registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                  onPress={() => {
                    if (detailQuery.data?.id) {
                      registerMutation.mutate(detailQuery.data.id);
                    }
                  }}
                  disabled={registerMutation.isPending || unregisterMutation.isPending}
                />
              )
            ) : null}

            <SecondaryButton label="Quay lại danh sách" onPress={() => router.back()} />
          </View>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.skeleton}>
      <SkeletonBlock height={34} width="90%" />
      <SkeletonBlock height={18} width="45%" />
      <SkeletonBlock height={22} />
      <SkeletonBlock height={22} />
      <SkeletonBlock height={210} />
      <SkeletonBlock height={22} />
      <SkeletonBlock height={22} width="80%" />
    </View>
  );
}

const styles = StyleSheet.create({
  backPill: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backLabel: {
    fontSize: 14,
  },
  article: {
    gap: 18,
  },
  articleHeader: {
    gap: 12,
  },
  articleTitle: {
    fontSize: 25,
    lineHeight: 33,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dateLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
  },
  skeleton: {
    gap: 12,
  },
});
