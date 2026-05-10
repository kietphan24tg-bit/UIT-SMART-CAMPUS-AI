import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useAppTheme } from '@/theme';

export interface SosMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
}

interface SosMapProps {
  markers: SosMapMarker[];
  height?: number | null;
  onPress?: () => void;
}

export function SosMap({
  markers,
  height = 280,
  onPress,
}: SosMapProps) {
  const theme = useAppTheme();
  const trackAsiaStyleUrl = process.env.EXPO_PUBLIC_TRACK_ASIA_STYLE_URL;
  const html = createMapHtml({
    markers,
    isDark: theme.isDark,
    trackAsiaStyleUrl,
  });

  return (
    <View
      style={[
        styles.mapWrap,
        {
          flex: height == null ? 1 : undefined,
          height: height ?? undefined,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceSubtle,
        },
      ]}
    >
      <WebView source={{ html }} style={styles.mapWebView} />
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở bản đồ SOS toàn màn hình"
          onPress={onPress}
          style={styles.overlay}
        >
          <View
            style={[
              styles.overlayChip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.medium,
                fontSize: 12,
              }}
            >
              Mở toàn màn hình
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function createMapHtml({
  markers,
  isDark,
  trackAsiaStyleUrl,
}: {
  markers: SosMapMarker[];
  isDark: boolean;
  trackAsiaStyleUrl?: string;
}) {
  const payload = JSON.stringify({
    markers,
  });
  const tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const textColor = isDark ? '#E2E8F0' : '#0F172A';
  const bgColor = isDark ? '#0B1220' : '#F8FAFC';

  if (trackAsiaStyleUrl?.trim()) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${bgColor}; color: ${textColor}; }
    .marker-dot {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 2px solid #fff;
    }
    .marker-dot { background: #EF4444; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const payload = ${payload};
    const fallbackCenter = [106.8034, 10.8702];
    const first = payload.markers[0];
    const center = first ? [first.lng, first.lat] : fallbackCenter;
    const map = new maplibregl.Map({
      container: 'map',
      style: '${trackAsiaStyleUrl}',
      center,
      zoom: first ? 15 : 13,
    });
    const bounds = new maplibregl.LngLatBounds();
    let hasBounds = false;

    payload.markers.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'marker-dot';
      new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText(item.title || 'SOS'))
        .addTo(map);
      bounds.extend([item.lng, item.lat]);
      hasBounds = true;
    });

    map.on('load', () => {
      if (hasBounds) {
        map.fitBounds(bounds, { padding: 32, duration: 0, maxZoom: 16 });
      }
    });
  </script>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${bgColor}; color: ${textColor}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const payload = ${payload};
    const fallbackCenter = [10.8702, 106.8034];
    const first = payload.markers[0];
    const center = first ? [first.lat, first.lng] : fallbackCenter;
    const map = L.map('map').setView(center, first ? 15 : 13);
    L.tileLayer('${tileLayer}', { maxZoom: 19 }).addTo(map);

    const points = [];
    payload.markers.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]).addTo(map);
      marker.bindPopup(item.title || 'SOS');
      points.push([item.lat, item.lng]);
    });

    if (points.length > 1) {
      map.fitBounds(points, { padding: [20, 20] });
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  mapWrap: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  overlayChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
