import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLockup } from './brand-lockup';
import { StatusBadge } from './status-badge';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';


interface TopHeroProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
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
}: TopHeroProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const useCompactBrand = brandCompact ?? layout.isCompact;
  const showBrandSubtitle = brandShowSubtitle ?? !useCompactBrand;
  const centerBrand = brandCentered && !headerRight;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.hero,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: theme.colors.primary }]} />
      <View style={[styles.accentFade, { backgroundColor: theme.colors.primaryMuted }]} />
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
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.heroSubtext,
              maxWidth: layout.isTablet ? 720 : undefined,
              fontFamily: theme.fonts.regular,
            },
          ]}
        >
          {subtitle}
        </Text>
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
  badgeWrap: {
    marginTop: 16,
  },
  children: {
    marginTop: 18,
  },
});
