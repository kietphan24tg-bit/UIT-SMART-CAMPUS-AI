import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollViewProps, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

type ScreenVariant = 'default' | 'muted' | 'glass' | 'fullBleed';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  style?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
  variant?: ScreenVariant;
}

interface ScreenScrollContextValue {
  enabled: boolean;
  scrollToField: (target: number | null) => void;
}

interface ScrollResponderLike {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean,
  ) => void;
}

type ScrollViewWithResponder = ScrollView & {
  getScrollResponder?: () => ScrollResponderLike | null;
};

const KEYBOARD_SCROLL_OFFSET = 56;
const KEYBOARD_SCROLL_DELAY = Platform.OS === 'ios' ? 48 : 96;
const KEYBOARD_EXTRA_BOTTOM_SPACE = 96;
const BASE_CONTENT_PADDING_BOTTOM = 32;

function resolvePaddingBottom(style: ViewStyle) {
  if (typeof style.paddingBottom === 'number') {
    return style.paddingBottom;
  }

  if (typeof style.paddingVertical === 'number') {
    return style.paddingVertical;
  }

  if (typeof style.padding === 'number') {
    return style.padding;
  }

  return 0;
}

export const ScreenScrollContext = createContext<ScreenScrollContextValue | null>(null);

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  refreshControl,
  variant = 'default',
}: ScreenProps) {
  const theme = useAppTheme();
  const scrollRef = useRef<ScrollViewWithResponder | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTargetRef = useRef<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle) ?? {};
  const isFullBleed = variant === 'fullBleed';
  const basePaddingBottom = isFullBleed ? 0 : BASE_CONTENT_PADDING_BOTTOM;
  const resolvedPaddingBottom =
    basePaddingBottom + keyboardInset + resolvePaddingBottom(flattenedContentStyle);
  const backgroundColor =
    variant === 'muted'
      ? theme.colors.backgroundMuted
      : variant === 'glass'
        ? theme.colors.surfaceGlass
        : theme.colors.background;

  const scheduleKeyboardScroll = useCallback(
    (target: number | null, delay = KEYBOARD_SCROLL_DELAY) => {
      if (!target) {
        return;
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const responder = scrollRef.current?.getScrollResponder?.();
        responder?.scrollResponderScrollNativeHandleToKeyboard?.(
          target,
          KEYBOARD_SCROLL_OFFSET,
          true,
        );
      }, delay);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scroll || Platform.OS === 'web') {
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height + KEYBOARD_EXTRA_BOTTOM_SPACE);
      scheduleKeyboardScroll(activeTargetRef.current, Platform.OS === 'ios' ? 24 : 72);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scheduleKeyboardScroll, scroll]);

  const scrollToField = useCallback(
    (target: number | null) => {
      if (!scroll || Platform.OS === 'web' || !target) {
        return;
      }
      activeTargetRef.current = target;
      scheduleKeyboardScroll(target);
    },
    [scheduleKeyboardScroll, scroll],
  );

  const contextValue = useMemo<ScreenScrollContextValue>(
    () => ({
      enabled: scroll && Platform.OS !== 'web',
      scrollToField,
    }),
    [scroll, scrollToField],
  );

  return (
    <ScreenScrollContext.Provider value={contextValue}>
      {isFullBleed ? (
        <View style={[styles.frame, { backgroundColor }, style]}>
          {scroll ? (
            <ScrollView
              ref={(instance) => {
                scrollRef.current = instance as ScrollViewWithResponder | null;
              }}
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                {
                  ...flattenedContentStyle,
                  paddingBottom: resolvedPaddingBottom,
                },
              ]}
              refreshControl={refreshControl}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inner}>{children}</View>
            </ScrollView>
          ) : (
            <View style={[styles.staticContent, contentContainerStyle]}>
              <View style={[styles.inner, styles.innerFill]}>{children}</View>
            </View>
          )}
        </View>
      ) : (
        <SafeAreaView style={[styles.safeArea, { backgroundColor }, style]}>
          {scroll ? (
            <ScrollView
              ref={(instance) => {
                scrollRef.current = instance as ScrollViewWithResponder | null;
              }}
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                {
                  ...flattenedContentStyle,
                  paddingBottom: resolvedPaddingBottom,
                },
              ]}
              refreshControl={refreshControl}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inner}>{children}</View>
            </ScrollView>
          ) : (
            <View style={[styles.staticContent, contentContainerStyle]}>
              <View style={[styles.inner, styles.innerFill]}>{children}</View>
            </View>
          )}
        </SafeAreaView>
      )}
    </ScreenScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  frame: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: BASE_CONTENT_PADDING_BOTTOM,
  },
  staticContent: {
    flex: 1,
    paddingBottom: BASE_CONTENT_PADDING_BOTTOM,
  },
  inner: {
    gap: 0,
  },
  innerFill: {
    flex: 1,
  },
});
