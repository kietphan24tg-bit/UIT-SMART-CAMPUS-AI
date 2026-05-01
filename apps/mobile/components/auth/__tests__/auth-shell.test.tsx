import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

const mockBrandLockup = jest.fn();

jest.mock('@/components/ui', () => {
  const React = jest.requireActual('react');

  return {
    BrandLockup: (props: Record<string, unknown>) => {
      mockBrandLockup(props);
      return null;
    },
    Screen: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('@/hooks/use-responsive-layout', () => ({
  useResponsiveLayout: () => ({
    viewportWidth: 393,
    viewportHeight: 852,
    isCompact: false,
    isRegularPhone: false,
    isWidePhone: true,
    isLargePhone: false,
    isExtraLargePhone: false,
    isTablet: false,
    isLargeScreen: false,
    horizontalPadding: 18,
    heroPadding: 18,
    contentMaxWidth: 393,
    narrowMaxWidth: 393,
    sectionGap: 18,
    availableWidth: 357,
    getGridColumns: () => 1,
    getGridItemWidth: () => 357,
  }),
}));

import { AuthShell } from '../auth-shell';

describe('AuthShell', () => {
  beforeEach(() => {
    mockBrandLockup.mockClear();
  });

  it('forces the auth banner brand lockup to stay flat', () => {
    render(
      <AuthShell
        heroImage={1}
        heroAlt="Auth hero"
        displayTitle="Hello!"
        displaySubtitle="Chào mừng đến với UIT Campus"
        panelTitle="Đăng nhập"
        panelSubtitle="Tiếp tục với email sinh viên"
      >
        <Text>Body</Text>
      </AuthShell>,
    );

    expect(mockBrandLockup).toHaveBeenCalledWith(
      expect.objectContaining({
        compact: true,
        showSubtitle: false,
        emphasis: 'flat',
        compactDensity: 'tight',
      }),
    );
  });
});
