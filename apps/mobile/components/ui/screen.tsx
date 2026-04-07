import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollViewProps, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  style?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
}

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  refreshControl,
}: ScreenProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }, style]}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
});
