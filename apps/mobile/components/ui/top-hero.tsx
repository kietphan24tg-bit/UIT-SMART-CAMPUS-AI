import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  children?: ReactNode;
}

export function TopHero({ eyebrow, title, subtitle, badge, children }: TopHeroProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.hero,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            maxWidth: layout.contentMaxWidth,
            paddingHorizontal: layout.heroPadding,
            paddingTop: layout.isTablet ? 20 : 16,
            paddingBottom: layout.isTablet ? 32 : 28,
          },
        ]}
      >
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.colors.heroSubtext }]}>{eyebrow}</Text>
        ) : null}
        <Text
          style={[
            styles.title,
            layout.isCompact ? styles.titleCompact : null,
            layout.isTablet ? styles.titleTablet : null,
            { color: theme.colors.heroText },
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
    width: '100%',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  titleCompact: {
    fontSize: 26,
  },
  titleTablet: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  badgeWrap: {
    marginTop: 16,
  },
  children: {
    marginTop: 18,
  },
});
