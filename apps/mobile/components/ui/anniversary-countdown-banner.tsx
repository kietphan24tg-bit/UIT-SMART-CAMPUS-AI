import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './buttons';

import { useNowTick } from '@/hooks/use-now-tick';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

export const UIT_20_ANNIVERSARY_TARGET_ISO = '2026-06-08T00:00:00+07:00';
const UIT_20_ANNIVERSARY_TARGET_MS = new Date(UIT_20_ANNIVERSARY_TARGET_ISO).getTime();

interface AnniversaryCountdownSnapshot {
  isComplete: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, '0');
}

export function getAnniversaryCountdownSnapshot(
  now = new Date(),
  targetMs = UIT_20_ANNIVERSARY_TARGET_MS,
): AnniversaryCountdownSnapshot {
  const remainingMs = Math.max(targetMs - now.getTime(), 0);

  if (remainingMs === 0) {
    return {
      isComplete: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isComplete: false,
    days,
    hours,
    minutes,
    seconds,
  };
}

function formatAccessibilityLabel(snapshot: AnniversaryCountdownSnapshot) {
  if (snapshot.isComplete) {
    return 'Hôm nay UIT tròn 20 năm.';
  }

  return `Còn ${snapshot.days} ngày, ${snapshot.hours} giờ, ${snapshot.minutes} phút, ${snapshot.seconds} giây tới kỷ niệm 20 năm UIT.`;
}

export function AnniversaryCountdownBanner({ onPlayPress }: { onPlayPress?: () => void }) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const snapshot = getAnniversaryCountdownSnapshot(new Date());

  useNowTick(snapshot.isComplete ? 60_000 : 1_000);

  const countdownItems = [
    {
      id: 'days',
      label: 'Ngày',
      value: `${snapshot.days}`,
      accentColor: theme.colors.primary,
      accentSurface: theme.colors.primarySurface,
    },
    {
      id: 'hours',
      label: 'Giờ',
      value: padTimeUnit(snapshot.hours),
      accentColor: theme.colors.accentAcademic,
      accentSurface: theme.colors.accentAcademicSurface,
    },
    {
      id: 'minutes',
      label: 'Phút',
      value: padTimeUnit(snapshot.minutes),
      accentColor: theme.colors.accentTelemetry,
      accentSurface: theme.colors.accentTelemetrySurface,
    },
    {
      id: 'seconds',
      label: 'Giây',
      value: padTimeUnit(snapshot.seconds),
      accentColor: theme.colors.warning,
      accentSurface: theme.colors.warningSurface,
    },
  ] as const;

  return (
    <View
      testID="anniversary-countdown-banner"
      accessible
      accessibilityLabel={formatAccessibilityLabel(snapshot)}
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? theme.colors.surfaceGlass : theme.colors.surfaceGlassStrong,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          padding: layout.isCompact ? 14 : layout.isTablet ? 20 : 18,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.topAccent,
          {
            backgroundColor: theme.isDark ? theme.colors.accentAcademic : theme.colors.primaryMuted,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.coolOrb,
          {
            backgroundColor: theme.isDark ? theme.colors.primarySurface : theme.colors.heroMuted,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.warmOrb,
          {
            backgroundColor: theme.colors.warningSurface,
            opacity: theme.isDark ? 0.4 : 0.72,
          },
        ]}
      />

      <View style={[styles.header, layout.isCompact ? styles.headerStacked : null]}>
        <View style={styles.copyWrap}>
          <View
            style={[
              styles.eyebrowChip,
              {
                backgroundColor: theme.isDark ? theme.colors.surfaceElevated : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.eyebrow,
                { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
              ]}
            >
              UIT 20 năm
            </Text>
          </View>
          <Text
            style={[
              styles.title,
              layout.isTablet ? styles.titleTablet : null,
              { color: theme.colors.heroText, fontFamily: theme.fonts.bold },
            ]}
          >
            {snapshot.isComplete ? 'Hôm nay UIT tròn 20 năm' : 'Đếm ngược tới 20 năm UIT'}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.heroSubtext, fontFamily: theme.fonts.regular },
            ]}
          >
            {snapshot.isComplete
              ? '08.06.2006 - 08.06.2026'
              : 'Mốc kỷ niệm chính thức vào 08.06.2026'}
          </Text>
          <View style={styles.milestoneRow}>
            <Text
              style={[
                styles.milestoneText,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
              ]}
            >
              2006
            </Text>
            <View style={[styles.milestoneDot, { backgroundColor: theme.colors.primaryMuted }]} />
            <Text
              style={[
                styles.milestoneText,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
              ]}
            >
              2026
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.dateChip,
            {
              backgroundColor: theme.colors.warningSurface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.dateChipText,
              { color: theme.colors.warning, fontFamily: theme.fonts.semibold },
            ]}
          >
            08.06.2026
          </Text>
        </View>
      </View>

      {onPlayPress ? (
        <PrimaryButton
          label="Chơi ghép ảnh UIT"
          onPress={onPlayPress}
          style={styles.playButton}
        />
      ) : null}

      {snapshot.isComplete ? (
        <View
          style={[
            styles.celebrationPanel,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.celebrationText,
              { color: theme.colors.text, fontFamily: theme.fonts.medium },
            ]}
          >
            Hành trình 20 năm UIT đang tiếp tục được viết bằng chính trải nghiệm campus hôm nay.
          </Text>
        </View>
      ) : (
        <View
          testID="anniversary-countdown-grid"
          style={[styles.grid, layout.isCompact ? styles.gridCompact : styles.gridRegular]}
        >
          {countdownItems.map((item) => (
            <View
              key={item.id}
              testID={`anniversary-countdown-${item.id}`}
              style={[
                styles.countdownCard,
                layout.isCompact ? styles.countdownCardCompact : styles.countdownCardRegular,
                {
                  backgroundColor: theme.isDark ? theme.colors.surfaceElevated : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.countdownAccent,
                  {
                    backgroundColor: item.accentColor,
                    shadowColor: item.accentColor,
                  },
                ]}
              />
              <Text
                testID={`anniversary-countdown-${item.id}-value`}
                style={[
                  styles.countdownValue,
                  layout.isTablet ? styles.countdownValueTablet : null,
                  { color: theme.colors.heroText, fontFamily: theme.fonts.bold },
                ]}
              >
                {item.value}
              </Text>
              <View
                style={[
                  styles.countdownLabelChip,
                  {
                    backgroundColor: item.accentSurface,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.countdownLabel,
                    { color: item.accentColor, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  topAccent: {
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  coolOrb: {
    borderRadius: 120,
    height: 120,
    opacity: 0.95,
    position: 'absolute',
    right: -26,
    top: -14,
    width: 120,
  },
  warmOrb: {
    borderRadius: 90,
    bottom: -28,
    height: 90,
    left: -18,
    position: 'absolute',
    width: 90,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerStacked: {
    flexDirection: 'column',
  },
  copyWrap: {
    flex: 1,
    gap: 6,
  },
  eyebrowChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 10,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  titleTablet: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  milestoneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  milestoneText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  milestoneDot: {
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  dateChip: {
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  dateChipText: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  grid: {
    gap: 10,
  },
  playButton: {
    width: '100%',
  },
  gridRegular: {
    flexDirection: 'row',
  },
  gridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  countdownCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 88,
    paddingHorizontal: 10,
    paddingVertical: 14,
    position: 'relative',
  },
  countdownCardRegular: {
    flex: 1,
  },
  countdownCardCompact: {
    width: '48%',
  },
  countdownAccent: {
    borderRadius: 999,
    height: 4,
    opacity: 0.94,
    position: 'absolute',
    top: 0,
    width: '62%',
  },
  countdownValue: {
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  countdownValueTablet: {
    fontSize: 32,
    lineHeight: 36,
  },
  countdownLabelChip: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 68,
    paddingHorizontal: 12,
  },
  countdownLabel: {
    fontSize: 12,
    includeFontPadding: false,
    letterSpacing: 0,
  },
  celebrationPanel: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  celebrationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
