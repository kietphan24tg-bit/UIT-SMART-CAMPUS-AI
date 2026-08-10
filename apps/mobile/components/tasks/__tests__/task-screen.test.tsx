import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { TaskScreen } from '../task-screen';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as unknown as jest.Mock;

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
    getGridColumns: ({ maxColumns }: { maxColumns?: number }) => (width >= 600 ? maxColumns ?? 2 : 1),
    getGridItemWidth: () => width,
  };
}

describe('TaskScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps single-column task records inside the card width on phones', () => {
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(320));

    const config = {
      eyebrow: 'Vận hành',
      title: 'Fire alert',
      subtitle: 'Kiểm tra layout mobile.',
      badge: { label: 'Live', tone: 'danger' as const },
      sections: [
        {
          title: 'Mục gần đây',
          records: [
            {
              id: 'fire-1',
              title: 'Cảm biến lửa đã kích hoạt tại bãi xe UIT Campus.',
              subtitle: 'Cổng uit-gate-a',
              meta: '14:34 05-06',
              statusLabel: 'Đang mở',
              tone: 'danger' as const,
            },
          ],
        },
      ],
    };

    const { getByTestId } = render(
      <TaskScreen config={config} onActionPress={jest.fn()} onRecordPress={jest.fn()} />,
    );

    const card = getByTestId('task-record-fire-1');
    const flattened = StyleSheet.flatten(card.props.style);

    expect(flattened.width).toBe('100%');
  });
});
