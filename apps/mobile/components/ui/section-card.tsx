import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from './buttons';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

type SectionCardVariant =
  | 'elevated'
  | 'outlined'
  | 'subtle'
  | 'highlight'
  | 'metric'
  | 'list'
  | 'glass'
  | 'danger';

type SectionCardTone =
  | 'primary'
  | 'campus'
  | 'academic'
  | 'telemetry'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: ReactNode;
  variant?: SectionCardVariant;
  tone?: SectionCardTone;
  icon?: ReactNode;
  headerAccessory?: ReactNode;
  footer?: ReactNode;
  showAccentLine?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
  variant = 'elevated',
  tone = 'primary',
  icon,
  headerAccessory,
  footer,
  showAccentLine = false,
}: SectionCardProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const hasHeaderExtras = Boolean(actionLabel || headerAccessory);
  const shouldStackHeader = !layout.isTablet && Boolean(subtitle) && hasHeaderExtras;
  const accentColor =
    tone === 'campus'
      ? theme.colors.accentCampus
      : tone === 'academic'
        ? theme.colors.accentAcademic
        : tone === 'telemetry'
          ? theme.colors.accentTelemetry
          : tone === 'success'
            ? theme.colors.success
            : tone === 'warning'
              ? theme.colors.warning
              : tone === 'danger'
                ? theme.colors.danger
                : tone === 'info'
                  ? theme.colors.info
                  : theme.colors.primary;
  const accentSurface =
    tone === 'campus'
      ? theme.colors.accentCampusSurface
      : tone === 'academic'
        ? theme.colors.accentAcademicSurface
        : tone === 'telemetry'
          ? theme.colors.accentTelemetrySurface
          : tone === 'success'
            ? theme.colors.successSurface
            : tone === 'warning'
              ? theme.colors.warningSurface
              : tone === 'danger'
                ? theme.colors.dangerSurface
                : tone === 'info'
                  ? theme.colors.infoSurface
                  : theme.colors.primarySurface;
  const backgroundColor =
    variant === 'outlined'
      ? theme.colors.surface
      : variant === 'subtle'
        ? theme.colors.surfaceSubtle
        : variant === 'glass'
          ? theme.colors.surfaceGlass
          : variant === 'highlight'
            ? theme.colors.surfaceTinted
            : variant === 'metric'
              ? theme.colors.surfaceElevated
              : variant === 'danger'
                ? theme.colors.dangerSurface
                : variant === 'list'
                  ? theme.colors.surface
                  : theme.colors.surfaceElevated;
  const elevationStyle =
    variant === 'elevated' ? theme.elevation.level1 : theme.elevation.level0;
  const cardPadding = layout.isTablet
    ? variant === 'metric'
      ? 18
      : 22
    : layout.isCompact
      ? variant === 'metric'
        ? 14
        : 16
      : variant === 'metric'
        ? 16
        : 18;
  const contentSpacing =
    variant === 'metric' || variant === 'list'
      ? layout.isCompact
        ? 12
        : 14
      : layout.isCompact
        ? 14
        : 16;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: variant === 'subtle' || variant === 'glass' ? 'transparent' : theme.colors.border,
          borderWidth: variant === 'subtle' || variant === 'glass' || variant === 'highlight' ? 0 : 1,
          borderRadius: theme.radii.xl,
          padding: cardPadding,
        },
        elevationStyle as never,
      ]}
    >
      {showAccentLine ? (
        <View
          style={[
            styles.accentLine,
            {
              backgroundColor: variant === 'danger' ? theme.colors.danger : accentColor,
            },
          ]}
        />
      ) : null}
      <View
        testID="section-card-header"
        style={[styles.header, shouldStackHeader ? styles.headerStacked : null]}
      >
        <View style={[styles.titleWrap, shouldStackHeader ? styles.titleWrapStacked : null]}>
          <View style={styles.titleRow}>
            {icon ? (
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: accentSurface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {icon}
              </View>
            ) : null}
            <View style={styles.titleTextWrap}>
              <Text
                style={[
                  styles.title,
                  variant === 'metric' ? styles.titleMetric : null,
                  { color: theme.colors.text, fontFamily: theme.fonts.bold },
                ]}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    variant === 'metric' ? styles.subtitleMetric : null,
                    { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                  ]}
                  numberOfLines={variant === 'list' ? 1 : 2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {actionLabel || headerAccessory ? (
          <View
            testID="section-card-actions"
            style={[styles.actions, shouldStackHeader ? styles.actionsStacked : null]}
          >
            {headerAccessory ? (
              <View
                style={[
                  styles.headerAccessory,
                  shouldStackHeader ? styles.headerAccessoryStacked : null,
                ]}
              >
                {headerAccessory}
              </View>
            ) : null}
            {actionLabel && onActionPress ? (
              <SecondaryButton
                label={actionLabel}
                onPress={onActionPress}
                style={shouldStackHeader || layout.isCompact ? styles.actionButton : undefined}
              />
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={[styles.content, { marginTop: contentSpacing }]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleWrapStacked: {
    flex: 0,
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  actionsStacked: {
    width: '100%',
    alignItems: 'flex-start',
  },
  headerAccessory: {
    alignItems: 'flex-end',
  },
  headerAccessoryStacked: {
    alignItems: 'flex-start',
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 18,
  },
  titleMetric: {
    fontSize: 19,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  subtitleMetric: {
    marginTop: 3,
  },
  content: {
    marginTop: 0,
  },
  footer: {
    marginTop: 14,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});
