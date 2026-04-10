import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { PrimaryButton } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

const TOUR_URL = 'https://tuyensinh.uit.edu.vn/uit-tour-360/';
const TOUR_HOST = 'tuyensinh.uit.edu.vn';
const TOUR_PATH_PREFIX = '/uit-tour-360';

const INJECTED_GUARD_SCRIPT = `
(() => {
  const allowedOrigin = 'https://tuyensinh.uit.edu.vn';
  const allowedPathPrefix = '/uit-tour-360';
  const hiddenSelectors = ['#logoUit', '#logoCompanyMini', '#fullscreenToggle'];

  const hideUnsafeControls = () => {
    hiddenSelectors.forEach((selector) => {
      const node = document.querySelector(selector);
      if (!node) {
        return;
      }
      node.style.display = 'none';
      node.style.visibility = 'hidden';
      node.style.pointerEvents = 'none';
    });
  };

  const isAllowedHref = (href) => {
    if (!href || href.startsWith('#')) {
      return true;
    }
    try {
      const resolved = new URL(href, window.location.href);
      return resolved.origin === allowedOrigin && resolved.pathname.startsWith(allowedPathPrefix);
    } catch (error) {
      return false;
    }
  };

  const neutralizeOutboundLinks = () => {
    const anchors = document.querySelectorAll('a[href]');
    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (isAllowedHref(href)) {
        return;
      }
      anchor.setAttribute('href', '#');
      anchor.setAttribute('target', '_self');
      anchor.onclick = (event) => {
        event.preventDefault();
        return false;
      };
    });
  };

  hideUnsafeControls();
  neutralizeOutboundLinks();

  const observer = new MutationObserver(() => {
    hideUnsafeControls();
    neutralizeOutboundLinks();
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
  });
})();
true;
`;

function isAllowedTourUrl(rawUrl?: string) {
  if (!rawUrl) {
    return false;
  }

  if (rawUrl === 'about:blank') {
    return true;
  }

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    if (url.hostname !== TOUR_HOST) {
      return false;
    }

    return (
      url.pathname === TOUR_PATH_PREFIX ||
      url.pathname.startsWith(`${TOUR_PATH_PREFIX}/`)
    );
  } catch {
    return rawUrl.startsWith('#');
  }
}

export default function CampusMapViewScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const webViewRef = useRef<WebView>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleRetry = () => {
    setHasError(false);
    setInitialLoading(true);
    setReloadKey((value) => value + 1);
  };

  const isCompact = layout.isCompact;
  const isTablet = layout.isTablet;
  const overlayHorizontalInset = isCompact ? 14 : isTablet ? 24 : 20;
  const panelMaxWidth = isTablet ? 560 : 440;

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <WebView
        key={reloadKey}
        ref={webViewRef}
        testID="campus-map-webview"
        source={{ uri: TOUR_URL }}
        style={styles.webView}
        injectedJavaScript={INJECTED_GUARD_SCRIPT}
        onShouldStartLoadWithRequest={(request) => isAllowedTourUrl(request.url)}
        onNavigationStateChange={(state) => {
          if (!isAllowedTourUrl(state.url)) {
            const webViewHandle = webViewRef.current as unknown as { stopLoading?: () => void } | null;
            if (typeof webViewHandle?.stopLoading === 'function') {
              webViewHandle.stopLoading();
            }
          }
        }}
        onLoadStart={() => {
          setHasError(false);
        }}
        onLoadEnd={() => {
          setInitialLoading(false);
        }}
        onError={() => {
          setHasError(true);
          setInitialLoading(false);
        }}
        onHttpError={() => {
          setHasError(true);
          setInitialLoading(false);
        }}
        mediaPlaybackRequiresUserAction
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
      />

      {initialLoading && !hasError ? (
        <View style={[styles.overlay, { paddingHorizontal: overlayHorizontalInset }]} pointerEvents="none">
          <View
            style={[
              styles.loadingCard,
              { maxWidth: panelMaxWidth },
              {
                backgroundColor: theme.colors.glassStrong,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
              Đang tải tour 3D UIT...
            </Text>
          </View>
        </View>
      ) : null}

      {hasError ? (
        <View style={[styles.overlay, { paddingHorizontal: overlayHorizontalInset }]}>
          <View
            testID="campus-map-error-card"
            style={[
              styles.errorCard,
              { maxWidth: panelMaxWidth },
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
              Không thể tải tour 3D
            </Text>
            <Text
              style={[
                styles.errorDescription,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
              ]}
            >
              Vui lòng kiểm tra mạng và thử lại. Trải nghiệm vẫn sẽ mở trong ứng dụng sau khi tải thành công.
            </Text>
            <PrimaryButton label="Thử lại" onPress={handleRetry} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  errorCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
