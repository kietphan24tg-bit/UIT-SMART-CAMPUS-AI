import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, Screen, SecondaryButton } from '@/components/ui';
import { useAppTheme } from '@/theme';

export default function AttendanceHistoryPlaceholderScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          Lịch sử điểm danh
        </Text>
        <View style={styles.backHit} />
      </View>
      <ContentStack narrow overlapHero={false}>
        <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
          Tính năng lịch sử điểm danh cho sinh viên sẽ được cập nhật khi API phía máy chủ sẵn sàng.
        </Text>
        <SecondaryButton label="Quay lại" onPress={() => router.back()} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
