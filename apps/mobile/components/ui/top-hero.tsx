import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLockup } from './brand-lockup';
import { StatusBadge } from './status-badge';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

type TopHeroVariant = 'default' | 'accent' | 'glass' | 'immersive';

interface TopHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  };
  headerRight?: ReactNode;
  children?: ReactNode;
  showBrand?: boolean;
  brandCompact?: boolean;
  brandCentered?: boolean;
  brandShowSubtitle?: boolean;
  variant?: TopHeroVariant;
  subtitleLines?: number;
  showAccentLine?: boolean;
}

export function TopHero({
  eyebrow,
  title,
  subtitle,
  badge,
  headerRight,
  children,
  showBrand = false,
  brandCompact,
  brandCentered = false,
  brandShowSubtitle,
  variant = 'default',
  subtitleLines,
  showAccentLine = false,
}: TopHeroProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const useCompactBrand = brandCompact ?? layout.isCompact;
  const showBrandSubtitle = brandShowSubtitle ?? !useCompactBrand;
  const centerBrand = brandCentered && !headerRight;
  const resolvedSubtitle = subtitle?.trim() ?? '';
  const showSubtitle = resolvedSubtitle.length > 0;
  const subtitleMaxLines =
    subtitleLines ?? (variant === 'immersive' ? 1 : layout.isCompact ? 2 : 2);
  const backgroundColor =
    variant === 'accent'
      ? theme.colors.surfaceTinted
      : variant === 'glass'
        ? theme.colors.surfaceGlass
        : variant === 'immersive'
          ? theme.colors.backgroundMuted
          : theme.colors.hero;
  const borderColor =
    variant === 'accent'
      ? theme.colors.primarySurface
      : variant === 'glass'
        ? theme.colors.border
        : theme.colors.border;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderBottomColor: borderColor,
        },
        variant === 'glass' ? theme.elevation.level1 : theme.elevation.level0,
      ]}
    >
      {showAccentLine ? (
        <>
          <View
            style={[
              styles.accent,
              {
                backgroundColor:
                  variant === 'glass' ? theme.colors.accentTelemetry : theme.colors.primary,
              },
            ]}
          />
          <View
            style={[
              styles.accentFade,
              {
                backgroundColor:
                  variant === 'accent' ? theme.colors.accentAcademic : theme.colors.primaryMuted,
              },
            ]}
          />
        </>
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.glowOrbLeft,
          { backgroundColor: theme.colors.glow, opacity: variant === 'default' ? 0.7 : 0.9 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glowOrbRight,
          {
            backgroundColor: theme.colors.primarySurface,
            opacity: variant === 'glass' ? 0.7 : 0.5,
          },
        ]}
      />
      <View
        style={[
          styles.inner,
          {
            maxWidth: layout.contentMaxWidth,
            paddingHorizontal: layout.heroPadding,
            paddingTop: layout.isTablet ? 16 : 12,
            paddingBottom: layout.isTablet ? 26 : 22,
          },
        ]}
      >
        {showBrand || headerRight ? (
          <View style={[styles.topRow, centerBrand ? styles.topRowCenter : null]}>
            <View style={centerBrand ? styles.topRowLeftCenter : styles.topRowLeft}>
              {showBrand ? (
                <BrandLockup compact={useCompactBrand} showSubtitle={showBrandSubtitle} />
              ) : null}
            </View>
            {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
          </View>
        ) : null}
        {eyebrow ? (
          <Text
            style={[
              styles.eyebrow,
              {
                color: theme.colors.heroSubtext,
                marginTop: showBrand ? 18 : 0,
                fontFamily: theme.fonts.bold,
              },
            ]}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={[
            styles.title,
            layout.isCompact ? styles.titleCompact : null,
            layout.isTablet ? styles.titleTablet : null,
            { color: theme.colors.heroText, fontFamily: theme.fonts.bold },
          ]}
        >
          {title}
        </Text>
        {showSubtitle ? (
          <Text
            style={[
              styles.subtitle,
              variant === 'immersive' ? styles.subtitleImmersive : null,
              {
                color: theme.colors.heroSubtext,
                maxWidth: layout.isTablet ? 720 : undefined,
                fontFamily: theme.fonts.regular,
              },
            ]}
            numberOfLines={subtitleMaxLines}
          >
            {resolvedSubtitle}
          </Text>
        ) : null}
        {badge ? (
          <View style={styles.badgeWrap}>
            <StatusBadge label={badge.label} tone={badge.tone} />
          </View>
        ) : null}
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    width: '100%',
    overflow: 'hidden',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    zIndex: 1,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.88,
  },
  accentFade: {
    position: 'absolute',
    top: 0,
    right: -48,
    width: 170,
    height: 4,
    opacity: 0.55,
  },
  glowOrbLeft: {
    position: 'absolute',
    top: 24,
    left: -42,
    width: 140,
    height: 140,
    borderRadius: 140,
  },
  glowOrbRight: {
    position: 'absolute',
    top: 12,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 120,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topRowCenter: {
    justifyContent: 'center',
  },
  topRowLeft: {
    flex: 1,
  },
  topRowLeftCenter: {
    alignItems: 'center',
    flexShrink: 1,
    flexGrow: 0,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    marginTop: 6,
  },
  titleCompact: {
    fontSize: 24,
  },
  titleTablet: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  subtitleImmersive: {
    maxWidth: 680,
  },
  badgeWrap: {
    marginTop: 16,
  },
  children: {
    marginTop: 18,
  },
});
