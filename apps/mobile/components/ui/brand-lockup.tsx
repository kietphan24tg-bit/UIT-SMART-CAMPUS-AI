import { Image, StyleSheet, Text, View } from 'react-native';

import UIT_LOCKUP from '../../assets/brand/uit-lockup.png';
import UIT_MARK from '../../assets/brand/uit-mark.png';

import { useAppTheme } from '@/theme';

interface BrandLockupProps {
  compact?: boolean;
  showSubtitle?: boolean;
}

export function BrandLockup({ compact = false, showSubtitle = true }: BrandLockupProps) {
  const theme = useAppTheme();

  if (!compact) {
    return (
      <View style={styles.lockupWrap} accessibilityRole="image">
        <Image source={UIT_LOCKUP} style={styles.lockupImage} resizeMode="contain" accessibilityLabel="Logo UIT" />
        <Text style={[styles.lockupCaption, { color: theme.colors.heroSubtext, fontFamily: theme.fonts.semibold }]}>
          Smart Campus
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          {
            backgroundColor: theme.colors.primarySurface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Image source={UIT_MARK} style={styles.markImage} resizeMode="contain" accessibilityLabel="Biểu trưng UIT" />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>Smart Campus</Text>
        {showSubtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
            Đại học Công nghệ Thông tin
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockupWrap: {
    alignSelf: 'flex-start',
    gap: 6,
  },
  lockupImage: {
    height: 26,
    width: 260,
    maxWidth: '100%',
  },
  lockupCaption: {
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  markImage: {
    width: 28,
    height: 28,
  },
  copy: {
    gap: 2,
  },
  title: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
