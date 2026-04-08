import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from './buttons';

import { useAppTheme } from '@/theme';


interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xl,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.primarySurface,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{title}</Text>
      <Text
        style={[
          styles.description,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
      >
        {description}
      </Text>
      {actionLabel && onActionPress ? (
        <SecondaryButton label={actionLabel} onPress={onActionPress} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    padding: 22,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
