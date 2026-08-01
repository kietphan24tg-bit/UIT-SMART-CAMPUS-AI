import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './buttons';

import { useNowTick } from '@/hooks/use-now-tick';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

export const UIT_20_ANNIVERSARY_TARGET_ISO = '2026-06-08T00:00:00+07:00';
const UIT_20_ANNIVERSARY_TARGET_MS = new Date(UIT_20_ANNIVERSARY_TARGET_ISO).getTime();
const UIT_FOUNDING_YEAR = 2006;
const UIT_ANNIVERSARY_MONTH_INDEX = 5;
const UIT_ANNIVERSARY_DAY = 8;
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;

interface AnniversaryCountdownSnapshot {
  isComplete: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface AnnualAnniversarySnapshot {
  isAnniversaryToday: boolean;
  targetYear: number;
  anniversaryYears: number;
  targetDateLabel: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, '0');
}

function getCountdownUnits(remainingMs: number) {
  const totalSeconds = Math.floor(remainingMs / 1_000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
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

  return {
    isComplete: false,
    ...getCountdownUnits(remainingMs),
  };
}

function getUitAnniversaryStartMs(year: number) {
  return Date.UTC(year, UIT_ANNIVERSARY_MONTH_INDEX, UIT_ANNIVERSARY_DAY) - VIETNAM_UTC_OFFSET_MS;
}

export function getAnnualAnniversarySnapshot(now = new Date()): AnnualAnniversarySnapshot {
  const nowMs = now.getTime();
  const vietnamCalendarYear = new Date(nowMs + VIETNAM_UTC_OFFSET_MS).getUTCFullYear();
  const thisYearAnniversaryMs = getUitAnniversaryStartMs(vietnamCalendarYear);
  const isAnniversaryToday =
    nowMs >= thisYearAnniversaryMs && nowMs < thisYearAnniversaryMs + DAY_MS;
  const targetYear =
    nowMs < thisYearAnniversaryMs || isAnniversaryToday
      ? vietnamCalendarYear
      : vietnamCalendarYear + 1;
  const targetMs = getUitAnniversaryStartMs(targetYear);
  const remainingMs = isAnniversaryToday ? 0 : Math.max(targetMs - nowMs, 0);

  return {
    isAnniversaryToday,
    targetYear,
    anniversaryYears: targetYear - UIT_FOUNDING_YEAR,
    targetDateLabel: `08.06.${targetYear}`,
    ...getCountdownUnits(remainingMs),
  };
}

function formatAccessibilityLabel(snapshot: AnnualAnniversarySnapshot) {
  if (snapshot.isAnniversaryToday) {
    return `Hôm nay UIT tròn ${snapshot.anniversaryYears} năm. Chúc mừng sinh nhật UIT!`;
  }

  return `Còn ${snapshot.days} ngày, ${snapshot.hours} giờ, ${snapshot.minutes} phút, ${snapshot.seconds} giây tới ngày UIT tròn ${snapshot.anniversaryYears} năm, vào 08 tháng 06 năm ${snapshot.targetYear}.`;
}

export function AnniversaryCountdownBanner({ onPlayPress }: { onPlayPress?: () => void }) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const snapshot = getAnnualAnniversarySnapshot(new Date());

  useNowTick(1_000);

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
          backgroundColor: theme.isDark
            ? theme.colors.surfaceGlass
            : theme.colors.surfaceGlassStrong,
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
              UIT {snapshot.anniversaryYears} năm
            </Text>
          </View>
          <Text
            style={[
              styles.title,
              layout.isTablet ? styles.titleTablet : null,
              { color: theme.colors.heroText, fontFamily: theme.fonts.bold },
            ]}
          >
            {snapshot.isAnniversaryToday
              ? `Hôm nay UIT tròn ${snapshot.anniversaryYears} năm`
              : `Đếm ngược tới ngày UIT tròn ${snapshot.anniversaryYears} năm`}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.heroSubtext, fontFamily: theme.fonts.regular },
            ]}
          >
            {snapshot.isAnniversaryToday
              ? `08.06.${UIT_FOUNDING_YEAR} - ${snapshot.targetDateLabel}`
              : `Sinh nhật UIT vào ${snapshot.targetDateLabel}`}
          </Text>
          <View style={styles.milestoneRow}>
            <Text
              style={[
                styles.milestoneText,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
              ]}
            >
              {UIT_FOUNDING_YEAR}
            </Text>
            <View style={[styles.milestoneDot, { backgroundColor: theme.colors.primaryMuted }]} />
            <Text
              style={[
                styles.milestoneText,
                { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
              ]}
            >
              {snapshot.targetYear}
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
            {snapshot.targetDateLabel}
          </Text>
        </View>
      </View>

      {onPlayPress ? (
        <PrimaryButton label="Chơi ghép ảnh UIT" onPress={onPlayPress} style={styles.playButton} />
      ) : null}

      {snapshot.isAnniversaryToday ? (
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
            Hành trình {snapshot.anniversaryYears} năm UIT đang tiếp tục được viết bằng chính trải
            nghiệm campus hôm nay.
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
                  backgroundColor: theme.isDark
                    ? theme.colors.surfaceElevated
                    : theme.colors.surface,
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
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}
                testID={`anniversary-countdown-${item.id}-value`}
                style={[
                  styles.countdownValue,
                  item.value.length > 2 ? styles.countdownValueThreeDigits : null,
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
    minWidth: 0,
    paddingHorizontal: 8,
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
    textAlign: 'center',
    width: '100%',
  },
  countdownValueThreeDigits: {
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 28,
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
