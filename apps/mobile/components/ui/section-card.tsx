import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from './buttons';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';


interface SectionCardProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
}: SectionCardProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          padding: layout.isTablet ? 22 : 18,
        },
      ]}
    >
      <View style={[styles.header, layout.isCompact ? styles.headerStacked : null]}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
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
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
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
    fontSize: 19,
    fontWeight: '700',
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
