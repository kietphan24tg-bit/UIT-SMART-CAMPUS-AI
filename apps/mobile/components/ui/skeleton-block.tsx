import { StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { useAppTheme } from '@/theme';

interface SkeletonBlockProps {
  height: number;
  width?: DimensionValue;
  radius?: number;
}

export function SkeletonBlock({
  height,
  width = '100%',
  radius = 14,
}: SkeletonBlockProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.block,
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: theme.colors.backgroundMuted,
          borderColor: theme.colors.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
