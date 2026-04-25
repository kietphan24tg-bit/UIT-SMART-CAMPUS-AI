import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { MetricGrid } from '../metric-grid';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as unknown as jest.Mock;

const items = [
  { label: 'A', value: '1', helper: 'one', tone: 'info' as const },
  { label: 'B', value: '2', helper: 'two', tone: 'success' as const },
  { label: 'C', value: '3', helper: 'three', tone: 'warning' as const },
  { label: 'D', value: '4', helper: 'four', tone: 'primary' as const },
];

function createResponsiveLayout(width: number) {
  return {
    viewportWidth: width,
    viewportHeight: 800,
    isCompact: width < 360,
    isRegularPhone: width >= 360 && width < 393,
    isWidePhone: width >= 393 && width < 412,
    isLargePhone: width >= 412 && width < 480,
    isExtraLargePhone: width >= 480 && width < 600,
    isTablet: width >= 600,
    isLargeScreen: width >= 960,
    horizontalPadding: 16,
    heroPadding: 16,
    contentMaxWidth: width,
    narrowMaxWidth: width,
    sectionGap: 16,
    availableWidth: width,
    getGridColumns: jest.fn(),
    getGridItemWidth: jest.fn(),
  };
}

describe('MetricGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [320, 154],
    [360, 174],
    [390, 189],
    [768, 378],
  ])('keeps a fixed 2-column layout at width %i', async (containerWidth, expectedWidth) => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(containerWidth));

    const { getByTestId } = render(<MetricGrid items={items} fixedColumns={2} compactColumns={2} />);
    const grid = getByTestId('metric-grid');

    fireEvent(grid, 'layout', {
      nativeEvent: {
        layout: {
          x: 0,
          y: 0,
          width: containerWidth,
          height: 300,
        },
      },
    });

    await waitFor(() => {
      const cards = items.map((_, index) => getByTestId(`metric-grid-card-${index}`));
      expect(cards).toHaveLength(4);

      for (const card of cards) {
        const flattened = StyleSheet.flatten(card.props.style);
        expect(flattened.width).toBe(expectedWidth);
      }
    });
  });

  it('forces a 2x2 mobile layout for four metric cards when using the preset', async () => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(280));

    const { getByTestId } = render(<MetricGrid items={items} layoutPreset="mobileTwoByTwo" />);
    const grid = getByTestId('metric-grid');

    fireEvent(grid, 'layout', {
      nativeEvent: {
        layout: {
          x: 0,
          y: 0,
          width: 280,
          height: 300,
        },
      },
    });

    await waitFor(() => {
      const firstCard = getByTestId('metric-grid-card-0');
      const flattened = StyleSheet.flatten(firstCard.props.style);
      expect(flattened.width).toBe(134);
    });
  });
});
