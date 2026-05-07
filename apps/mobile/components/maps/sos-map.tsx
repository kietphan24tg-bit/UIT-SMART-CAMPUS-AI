import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useAppTheme } from '@/theme';

type ViewerLocation = {
  lat: number;
  lng: number;
  accuracyMeters?: number;
} | null;

export interface SosMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
}

interface SosMapProps {
  markers: SosMapMarker[];
  viewerLocation: ViewerLocation;
  routePolyline?: string | null;
  routeCoordinates?: Array<[number, number]> | null;
  height?: number | null;
  onPress?: () => void;
}

export function SosMap({
  markers,
  viewerLocation,
  routePolyline,
  routeCoordinates,
  height = 280,
  onPress,
}: SosMapProps) {
  const theme = useAppTheme();
  const trackAsiaStyleUrl = process.env.EXPO_PUBLIC_TRACK_ASIA_STYLE_URL;
  const html = createMapHtml({
    markers,
    viewerLocation,
    routePolyline,
    routeCoordinates,
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
  viewerLocation,
  routePolyline,
  routeCoordinates,
  isDark,
  trackAsiaStyleUrl,
}: {
  markers: SosMapMarker[];
  viewerLocation: ViewerLocation;
  routePolyline?: string | null;
  routeCoordinates?: Array<[number, number]> | null;
  isDark: boolean;
  trackAsiaStyleUrl?: string;
}) {
  const payload = JSON.stringify({
    markers,
    viewerLocation,
    routePolyline: routePolyline || null,
    routeCoordinates: routeCoordinates || null,
  });
  const tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const textColor = isDark ? '#E2E8F0' : '#0F172A';
  const bgColor = isDark ? '#0B1220' : '#F8FAFC';
  const routeColor = '#2563EB';

  const decoder = `
    function decodePolyline(encoded) {
      if (!encoded) return [];
      let index = 0;
      let lat = 0;
      let lng = 0;
      const coordinates = [];
      while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte = null;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += deltaLat;
        shift = 0;
        result = 0;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += deltaLng;
        coordinates.push([lng / 1e5, lat / 1e5]);
      }
      return coordinates;
    }
  `;

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
    .marker-dot, .viewer-dot {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 2px solid #fff;
    }
    .marker-dot { background: #EF4444; }
    .viewer-dot { background: #2563EB; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    ${decoder}
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

    if (payload.viewerLocation) {
      const viewer = document.createElement('div');
      viewer.className = 'viewer-dot';
      new maplibregl.Marker({ element: viewer })
        .setLngLat([payload.viewerLocation.lng, payload.viewerLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText('Vị trí của bạn'))
        .addTo(map);
      bounds.extend([payload.viewerLocation.lng, payload.viewerLocation.lat]);
      hasBounds = true;
    }

    map.on('load', () => {
      const routeCoords = Array.isArray(payload.routeCoordinates) && payload.routeCoordinates.length
        ? payload.routeCoordinates
        : decodePolyline(payload.routePolyline);
      if (routeCoords.length) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: routeCoords,
            },
          },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '${routeColor}',
            'line-width': 5,
          },
        });
        routeCoords.forEach((coord) => bounds.extend(coord));
        hasBounds = true;
      }

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
    ${decoder}
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

    if (payload.viewerLocation) {
      const viewer = L.circleMarker([payload.viewerLocation.lat, payload.viewerLocation.lng], {
        radius: 7,
        color: '#2563EB',
        fillColor: '#2563EB',
        fillOpacity: 0.85,
      }).addTo(map);
      viewer.bindPopup('Vị trí của bạn');
      points.push([payload.viewerLocation.lat, payload.viewerLocation.lng]);
    }

    const routeCoords = Array.isArray(payload.routeCoordinates) && payload.routeCoordinates.length
      ? payload.routeCoordinates.map((coord) => [coord[1], coord[0]])
      : decodePolyline(payload.routePolyline).map((coord) => [coord[1], coord[0]]);
    if (routeCoords.length) {
      L.polyline(routeCoords, {
        color: '${routeColor}',
        weight: 5,
        opacity: 0.95,
      }).addTo(map);
      routeCoords.forEach((coord) => points.push(coord));
    }

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
