import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from './buttons';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

type SectionCardVariant = 'elevated' | 'outlined' | 'subtle';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: ReactNode;
  variant?: SectionCardVariant;
}

export function SectionCard({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
  variant = 'elevated',
}: SectionCardProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const elevationStyle =
    variant === 'outlined' ? theme.elevation.level0 : theme.elevation.level2;
  const backgroundColor =
    variant === 'outlined'
      ? theme.colors.surface
      : variant === 'subtle'
        ? theme.colors.surfaceSubtle
        : theme.colors.surfaceElevated;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xl,
          padding: layout.isTablet ? 22 : layout.isCompact ? 16 : 18,
        },
        elevationStyle as never,
      ]}
    >
      <View style={[styles.header, layout.isCompact ? styles.headerStacked : null]}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionLabel && onActionPress ? (
          <SecondaryButton
            label={actionLabel}
            onPress={onActionPress}
            style={layout.isCompact ? styles.actionButton : undefined}
          />
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
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
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    marginTop: 16,
  },
});
