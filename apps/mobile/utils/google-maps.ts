import { Linking, Platform } from 'react-native';

function formatCoordinate(value: number) {
  return Number(value).toFixed(6);
}

export function getGoogleMapsDirectionUrls(
  lat: number,
  lng: number,
  platformOS: string = Platform.OS,
) {
  const destination = `${formatCoordinate(lat)},${formatCoordinate(lng)}`;
  const fallbackUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${destination}` +
    '&travelmode=driving';

  if (platformOS === 'ios') {
    return {
      appUrl: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
      fallbackUrl,
    };
  }

  if (platformOS === 'android') {
    return {
      appUrl: `google.navigation:q=${destination}`,
      fallbackUrl,
    };
  }

  return {
    appUrl: fallbackUrl,
    fallbackUrl,
  };
}

export async function openGoogleMapsDirections(
  lat: number,
  lng: number,
  platformOS: string = Platform.OS,
) {
  const { appUrl, fallbackUrl } = getGoogleMapsDirectionUrls(lat, lng, platformOS);

  const shouldUseAppUrl = platformOS === 'android' || platformOS === 'ios';

  if (shouldUseAppUrl) {
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
        return;
      }
    } catch {
      // Fall back to the web URL if the native Google Maps scheme cannot be checked.
    }
  }

  await Linking.openURL(fallbackUrl);
}
