import { Image, StyleSheet, Text, View } from 'react-native';

import UIT_MARK from '../../assets/brand/uit-mark.png';

import { useAppTheme } from '@/theme';

interface BrandLockupProps {
  compact?: boolean;
  showSubtitle?: boolean;
}

export function BrandLockup({ compact = false, showSubtitle = true }: BrandLockupProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[styles.root, compact ? styles.rootCompact : styles.rootFull]}
      accessibilityRole="image"
    >
      <View
        style={[
          styles.mark,
          compact ? styles.markCompact : styles.markFull,
          {
            backgroundColor: theme.colors.primarySurface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Image
          source={UIT_MARK}
          style={styles.markImage}
          resizeMode="contain"
          accessibilityLabel="Biểu trưng UIT"
        />
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.wordmark,
            compact ? styles.wordmarkCompact : styles.wordmarkFull,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
        >
          UIT Smart Campus
        </Text>
        {showSubtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
            ]}
          >
            Trường Đại học Công nghệ Thông tin
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rootCompact: {
    gap: 10,
  },
  rootFull: {
    gap: 12,
  },
  mark: {
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markCompact: {
    width: 40,
    height: 40,
  },
  markFull: {
    width: 48,
    height: 48,
  },
  markImage: {
    width: '68%',
    height: '68%',
  },
  copy: {
    flexShrink: 1,
    gap: 2,
  },
  wordmark: {
    letterSpacing: 0.2,
  },
  wordmarkCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  wordmarkFull: {
    fontSize: 17,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
