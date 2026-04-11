import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { useAppTheme } from '@/theme';

type SkeletonTone = 'neutral' | 'accent' | 'glass';

interface SkeletonBlockProps {
  height: number;
  width?: DimensionValue;
  radius?: number;
  tone?: SkeletonTone;
  animated?: boolean;
}

export function SkeletonBlock({
  height,
  width = '100%',
  radius = 14,
  tone = 'neutral',
  animated = true,
}: SkeletonBlockProps) {
  const theme = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) {
          setReduceMotion(value);
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    ) as { remove?: () => void } | undefined;

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!animated || reduceMotion) {
      shimmer.stopAnimation();
      shimmer.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: theme.motion.slow,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: theme.motion.slow,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [animated, reduceMotion, shimmer, theme.motion.slow]);

  const backgroundColor =
    tone === 'accent'
      ? theme.colors.primarySurface
      : tone === 'glass'
        ? theme.colors.surfaceGlass
        : theme.colors.surfaceSubtle;
  const borderColor = tone === 'glass' ? theme.colors.border : theme.colors.divider;
  const glowColor = tone === 'accent' ? theme.colors.primary : theme.colors.glow;
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.6],
  });
  const scale = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });

  return (
    <View
      style={[
        styles.block,
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {animated && !reduceMotion ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              backgroundColor: glowColor,
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
});
