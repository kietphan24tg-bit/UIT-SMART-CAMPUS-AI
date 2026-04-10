import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import CampusMapViewScreen from '../view';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as unknown as jest.Mock;

describe('CampusMapViewScreen', () => {
  beforeEach(() => {
    mockUseResponsiveLayout.mockReturnValue({
      isCompact: false,
      isTablet: false,
      viewportWidth: 390,
    });
  });

  it('shows loading initially and hides it after first load end', () => {
    const { getByTestId, getByText, queryByText } = render(<CampusMapViewScreen />);
    const webView = getByTestId('campus-map-webview');

    expect(getByText('Đang tải tour 3D UIT...')).toBeTruthy();

    act(() => {
      webView.props.onLoadEnd?.();
    });

    expect(queryByText('Đang tải tour 3D UIT...')).toBeNull();
  });

  it('blocks external urls from leaving the app', () => {
    const { getByTestId } = render(<CampusMapViewScreen />);
    const webView = getByTestId('campus-map-webview');

    expect(
      webView.props.onShouldStartLoadWithRequest({
        url: 'https://tuyensinh.uit.edu.vn/uit-tour-360/',
      }),
    ).toBe(true);
    expect(
      webView.props.onShouldStartLoadWithRequest({
        url: 'https://www.uit.edu.vn/',
      }),
    ).toBe(false);
  });

  it('shows retry state when webview errors and can retry', () => {
    const { getByTestId, getByText } = render(<CampusMapViewScreen />);
    const webView = getByTestId('campus-map-webview');

    act(() => {
      webView.props.onError?.();
    });

    expect(getByText('Không thể tải tour 3D')).toBeTruthy();

    fireEvent.press(getByText('Thử lại'));

    expect(getByText('Đang tải tour 3D UIT...')).toBeTruthy();
  });

  it('does not render top banner so native tour controls stay visible', () => {
    const { queryByTestId } = render(<CampusMapViewScreen />);

    expect(queryByTestId('campus-map-header')).toBeNull();
  });

  it('limits error panel width on tablet screens', () => {
    mockUseResponsiveLayout.mockReturnValue({
      isCompact: false,
      isTablet: true,
      viewportWidth: 834,
    });

    const { getByTestId } = render(<CampusMapViewScreen />);
    const webView = getByTestId('campus-map-webview');

    act(() => {
      webView.props.onError?.();
    });

    const errorCard = getByTestId('campus-map-error-card');
    const flattened = StyleSheet.flatten(errorCard.props.style);

    expect(flattened.maxWidth).toBe(560);
  });
});
