import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { StartupLoadingScreen } from '../startup-loading-screen';

describe('StartupLoadingScreen', () => {
  it('signals ready to display only once when the screen layout is measured repeatedly', () => {
    const onReadyToDisplay = jest.fn();
    const screen = render(<StartupLoadingScreen onReadyToDisplay={onReadyToDisplay} />);

    fireEvent(screen.getByTestId('startup-loading-screen'), 'layout', {
      nativeEvent: { layout: { height: 812, width: 375, x: 0, y: 0 } },
    });
    fireEvent(screen.getByTestId('startup-loading-screen'), 'layout', {
      nativeEvent: { layout: { height: 812, width: 375, x: 0, y: 0 } },
    });

    expect(onReadyToDisplay).toHaveBeenCalledTimes(1);
  });
});
