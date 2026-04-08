import { Image } from 'expo-image';
import type { ImageContentPosition } from 'expo-image';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { BrandLockup, Screen } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

interface AuthShellProps {
  heroImage: number;
  heroPosition?: ImageContentPosition;
  heroAlt: string;
  heroLabel?: string;
  displayTitle: string;
  displaySubtitle: string;
  panelTitle: string;
  panelSubtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  heroImage,
  heroPosition = 'center',
  heroAlt,
  heroLabel,
  displayTitle,
  displaySubtitle,
  panelTitle,
  panelSubtitle,
  children,
  footer,
}: AuthShellProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const isSplit = layout.isTablet;
  const isPhone = !isSplit;
  const isCompactPhone = isPhone && (layout.isCompact || layout.isRegularPhone);
  const useBrowserScroll = Platform.OS === 'web' && isPhone;
  const heroHeight = isSplit
    ? Math.max(Math.min(layout.viewportHeight - 168, 620), 420)
    : Math.round(
        Math.min(
          Math.max(
            layout.viewportHeight * (isCompactPhone ? 0.22 : 0.235),
            isCompactPhone ? 176 : 192,
          ),
          isCompactPhone ? 212 : 228,
        ),
      );
  const titleSize = isSplit
    ? 78
    : layout.isCompact
      ? 44
      : layout.isRegularPhone
        ? 48
        : layout.isWidePhone
          ? 52
          : layout.isLargePhone
            ? 54
            : 58;
  const subtitleSize = isSplit ? 30 : layout.isCompact ? 18 : layout.isRegularPhone ? 19 : 21;
  const shellMaxWidth = isSplit ? 1120 : layout.narrowMaxWidth;
  const heroInnerPadding = isSplit ? 28 : isCompactPhone ? 16 : 18;
  const panelPadding = isSplit ? 28 : isCompactPhone ? 15 : 16;
  const shellGap = isSplit ? 24 : isCompactPhone ? 12 : 14;
  const phoneTopPadding = isCompactPhone ? 10 : 14;
  const phoneBottomPadding = isCompactPhone ? 18 : 22;
  const panelTitleSize = isSplit ? 28 : isCompactPhone ? 24 : 26;
  const titleLetterSpacing = isSplit ? -1.4 : layout.isCompact ? -0.3 : -0.5;
  const titleLineHeight = Math.round(titleSize * (isSplit ? 0.95 : 1.12));
  const titleVerticalPadding = Platform.OS === 'android' && isPhone ? 4 : 0;

  useEffect(() => {
    if (!useBrowserScroll || typeof document === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const previous = {
      htmlOverflowY: html.style.overflowY,
      htmlHeight: html.style.height,
      bodyOverflowY: body.style.overflowY,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      rootHeight: root?.style.height ?? '',
      rootMinHeight: root?.style.minHeight ?? '',
      rootDisplay: root?.style.display ?? '',
    };

    html.style.overflowY = 'auto';
    html.style.height = 'auto';
    body.style.overflowY = 'auto';
    body.style.overflow = 'auto';
    body.style.height = 'auto';

    if (root) {
      root.style.height = 'auto';
      root.style.minHeight = '100%';
      root.style.display = 'block';
    }

    return () => {
      html.style.overflowY = previous.htmlOverflowY;
      html.style.height = previous.htmlHeight;
      body.style.overflowY = previous.bodyOverflowY;
      body.style.overflow = previous.bodyOverflow;
      body.style.height = previous.bodyHeight;

      if (root) {
        root.style.height = previous.rootHeight;
        root.style.minHeight = previous.rootMinHeight;
        root.style.display = previous.rootDisplay;
      }
    };
  }, [useBrowserScroll]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        scroll={!useBrowserScroll}
        contentContainerStyle={{
          flexGrow: isSplit ? 1 : useBrowserScroll ? undefined : 0,
          paddingBottom: theme.spacing.xl,
        }}
      >
        <View
          style={[
            styles.outer,
            {
              justifyContent: isSplit ? 'center' : 'flex-start',
              minHeight: isSplit ? layout.viewportHeight - 28 : undefined,
              paddingTop: isPhone ? phoneTopPadding : 0,
              paddingBottom: isPhone ? phoneBottomPadding : 0,
            },
          ]}
        >
          <View
            style={[
              styles.shell,
              {
                maxWidth: shellMaxWidth,
                paddingHorizontal: layout.horizontalPadding,
                flexDirection: isSplit ? 'row' : 'column',
                justifyContent: isSplit ? 'center' : 'flex-start',
                alignItems: isSplit ? 'stretch' : 'center',
                gap: shellGap,
              },
            ]}
          >
            <View
              style={[
                styles.heroCard,
                isPhone ? styles.heroCardPhone : null,
                theme.elevation.level2 as never,
                {
                  minHeight: heroHeight,
                  borderColor: theme.colors.border,
                  flex: isSplit ? 1.08 : undefined,
                  width: '100%',
                },
              ]}
            >
              <Image
                source={heroImage}
                style={styles.heroImage}
                contentFit="cover"
                contentPosition={heroPosition}
                transition={180}
                accessibilityLabel={heroAlt}
              />
              <View
                style={[
                  styles.heroOverlay,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(3, 11, 24, 0.48)'
                      : 'rgba(12, 40, 92, 0.26)',
                  },
                ]}
              />
              <View
                style={[
                  styles.heroOrb,
                  styles.heroOrbPrimary,
                  isPhone ? styles.heroOrbPrimaryPhone : null,
                  { backgroundColor: theme.colors.glow },
                ]}
              />
              <View
                style={[
                  styles.heroOrb,
                  styles.heroOrbAccent,
                  isPhone ? styles.heroOrbAccentPhone : null,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.22)',
                  },
                ]}
              />
              <View
                style={[
                  styles.heroInner,
                  isPhone ? styles.heroInnerPhone : null,
                  { padding: heroInnerPadding },
                ]}
              >
                <View style={[styles.heroTop, isPhone ? styles.heroTopPhone : null]}>
                  <View
                    style={[
                      styles.brandBadge,
                      isPhone ? styles.brandBadgePhone : null,
                      {
                        backgroundColor: theme.colors.glassStrong,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <BrandLockup compact showSubtitle={isSplit} />
                  </View>
                  {heroLabel ? (
                    <View
                      style={[
                        styles.heroLabel,
                        isPhone ? styles.heroLabelPhone : null,
                        {
                          backgroundColor: theme.colors.glassStrong,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.heroLabelText,
                          { color: theme.colors.primary, fontFamily: theme.fonts.bold },
                        ]}
                      >
                        {heroLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.heroCopy, isPhone ? styles.heroCopyPhone : null]}>
                  <Text
                    style={[
                      styles.displayTitle,
                      {
                        color: theme.palette.text.inverse,
                        fontFamily: theme.fonts.bold,
                        fontSize: titleSize,
                        lineHeight: titleLineHeight,
                        letterSpacing: titleLetterSpacing,
                        paddingTop: titleVerticalPadding,
                        paddingBottom: titleVerticalPadding,
                        includeFontPadding: true,
                      },
                    ]}
                  >
                    {displayTitle}
                  </Text>
                  <Text
                    style={[
                      styles.displaySubtitle,
                      isPhone ? styles.displaySubtitlePhone : null,
                      {
                        color: theme.palette.text.inverse,
                        fontFamily: theme.fonts.semibold,
                        fontSize: subtitleSize,
                        lineHeight: subtitleSize * 1.1,
                      },
                    ]}
                  >
                    {displaySubtitle}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.panel,
                isPhone ? styles.panelPhone : null,
                theme.elevation.level2 as never,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  padding: panelPadding,
                  flex: isSplit ? 0.92 : undefined,
                  maxWidth: isSplit ? 500 : undefined,
                  width: '100%',
                },
              ]}
            >
              <Text
                style={[
                  styles.panelTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.fonts.bold,
                    fontSize: panelTitleSize,
                  },
                ]}
              >
                {panelTitle}
              </Text>
              <Text
                style={[
                  styles.panelSubtitle,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                {panelSubtitle}
              </Text>

              <View style={[styles.panelContent, isPhone ? styles.panelContentPhone : null]}>
                {children}
              </View>
              {footer ? (
                <View style={[styles.footer, isPhone ? styles.footerPhone : null]}>{footer}</View>
              ) : null}
            </View>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    justifyContent: 'center',
  },
  shell: {
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  heroCardPhone: {
    borderRadius: 26,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroOrbPrimary: {
    width: 240,
    height: 240,
    top: -34,
    right: -48,
  },
  heroOrbPrimaryPhone: {
    width: 132,
    height: 132,
    top: -16,
    right: -18,
  },
  heroOrbAccent: {
    width: 180,
    height: 180,
    bottom: -42,
    left: -32,
  },
  heroOrbAccentPhone: {
    width: 110,
    height: 110,
    bottom: -18,
    left: -14,
  },
  heroInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroInnerPhone: {
    justifyContent: 'flex-start',
    gap: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTopPhone: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 8,
  },
  brandBadge: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  brandBadgePhone: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroLabel: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  heroLabelPhone: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroLabelText: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroCopy: {
    gap: 10,
  },
  heroCopyPhone: {
    gap: 6,
    marginTop: 8,
  },
  displayTitle: {
    flexShrink: 1,
  },
  displaySubtitle: {
    maxWidth: 520,
  },
  displaySubtitlePhone: {
    maxWidth: '88%',
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    alignSelf: 'center',
  },
  panelPhone: {
    borderRadius: 24,
  },
  panelTitle: {
    fontSize: 28,
  },
  panelSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  panelContent: {
    marginTop: 20,
    gap: 16,
  },
  panelContentPhone: {
    marginTop: 16,
    gap: 14,
  },
  footer: {
    marginTop: 18,
    gap: 14,
  },
  footerPhone: {
    marginTop: 14,
    gap: 12,
  },
});
