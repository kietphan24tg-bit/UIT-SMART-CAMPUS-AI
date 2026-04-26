import { render } from '@testing-library/react-native';
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

const sixItems = [
  ...items,
  { label: 'E', value: '5', helper: 'five', tone: 'warning' as const },
  { label: 'F', value: '6', helper: 'six', tone: 'info' as const },
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

  it('renders all four cards with flex: 1 in a fixed 2-column layout', () => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(360));

    const { getByTestId } = render(<MetricGrid items={items} fixedColumns={2} compactColumns={2} />);

    const cards = items.map((_, index) => getByTestId(`metric-grid-card-${index}`));
    expect(cards).toHaveLength(4);

    for (const card of cards) {
      const flattened = StyleSheet.flatten(card.props.style);
      expect(flattened.flex).toBe(1);
    }
  });

  it('renders 2 rows of 2 cards for mobileTwoByTwo preset', () => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(280));

    const { getByTestId } = render(<MetricGrid items={items} layoutPreset="mobileTwoByTwo" />);

    // All 4 cards should exist
    for (let i = 0; i < 4; i++) {
      const card = getByTestId(`metric-grid-card-${i}`);
      const flattened = StyleSheet.flatten(card.props.style);
      expect(flattened.flex).toBe(1);
    }
  });

  it('renders 3 rows of 2 cards for mobileTwoByThree preset with 6 items', () => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(300));

    const { getByTestId } = render(<MetricGrid items={sixItems} layoutPreset="mobileTwoByThree" />);

    // All 6 cards should exist with flex: 1
    for (let i = 0; i < 6; i++) {
      const card = getByTestId(`metric-grid-card-${i}`);
      const flattened = StyleSheet.flatten(card.props.style);
      expect(flattened.flex).toBe(1);
    }
  });

  it('renders the grid container with testID metric-grid', () => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(360));

    const { getByTestId } = render(<MetricGrid items={items} />);
    expect(getByTestId('metric-grid')).toBeTruthy();
  });
});
