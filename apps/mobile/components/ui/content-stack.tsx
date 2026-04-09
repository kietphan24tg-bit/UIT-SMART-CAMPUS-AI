import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

interface ContentStackProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
  narrow?: boolean;
  overlapHero?: boolean;
}

export function ContentStack({
  children,
  style,
  gap,
  narrow = false,
  overlapHero = false,
}: ContentStackProps) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.base,
        {
          maxWidth: narrow ? layout.narrowMaxWidth : layout.contentMaxWidth,
          paddingHorizontal: layout.horizontalPadding,
          marginTop: overlapHero ? (layout.isTablet ? -20 : -16) : layout.sectionGap,
          gap: gap ?? layout.sectionGap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    alignSelf: 'center',
  },
});
