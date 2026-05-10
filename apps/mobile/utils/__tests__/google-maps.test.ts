import { Linking } from 'react-native';

import {
  getGoogleMapsDirectionUrls,
  openGoogleMapsDirections,
} from '../google-maps';

describe('google maps helper', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds the Android Google Maps URLs', () => {
    expect(getGoogleMapsDirectionUrls(10.87, 106.8, 'android')).toEqual({
      appUrl: 'google.navigation:q=10.870000,106.800000',
      fallbackUrl:
        'https://www.google.com/maps/dir/?api=1&destination=10.870000,106.800000&travelmode=driving',
    });
  });

  it('builds the iOS Google Maps URLs', () => {
    expect(getGoogleMapsDirectionUrls(10.87, 106.8, 'ios')).toEqual({
      appUrl:
        'comgooglemaps://?daddr=10.870000,106.800000&directionsmode=driving',
      fallbackUrl:
        'https://www.google.com/maps/dir/?api=1&destination=10.870000,106.800000&travelmode=driving',
    });
  });

  it('opens the native Google Maps app when the deep link is available', async () => {
    const canOpenUrlSpy = jest
      .spyOn(Linking, 'canOpenURL')
      .mockResolvedValue(true);
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await openGoogleMapsDirections(10.87, 106.8, 'android');

    expect(canOpenUrlSpy).toHaveBeenCalledWith(
      'google.navigation:q=10.870000,106.800000',
    );
    expect(openUrlSpy).toHaveBeenCalledWith(
      'google.navigation:q=10.870000,106.800000',
    );
  });

  it('falls back to the web URL when the native deep link is unavailable', async () => {
    const canOpenUrlSpy = jest
      .spyOn(Linking, 'canOpenURL')
      .mockResolvedValue(false);
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await openGoogleMapsDirections(10.87, 106.8, 'ios');

    expect(canOpenUrlSpy).toHaveBeenCalledWith(
      'comgooglemaps://?daddr=10.870000,106.800000&directionsmode=driving',
    );
    expect(openUrlSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=10.870000,106.800000&travelmode=driving',
    );
  });

  it('falls back to the web URL when checking the native deep link throws', async () => {
    const canOpenUrlSpy = jest
      .spyOn(Linking, 'canOpenURL')
      .mockRejectedValue(new Error('cannot check'));
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await openGoogleMapsDirections(10.87, 106.8, 'android');

    expect(canOpenUrlSpy).toHaveBeenCalledWith(
      'google.navigation:q=10.870000,106.800000',
    );
    expect(openUrlSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=10.870000,106.800000&travelmode=driving',
    );
  });
});
