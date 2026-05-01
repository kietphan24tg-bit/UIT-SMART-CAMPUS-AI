import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { SectionCard } from '../section-card';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as jest.Mock;

const baseLayout = {
    viewportWidth: 390,
    viewportHeight: 844,
    isCompact: false,
    isRegularPhone: true,
    isWidePhone: false,
    isLargePhone: false,
    isExtraLargePhone: false,
    isTablet: false,
    isLargeScreen: false,
    horizontalPadding: 16,
    heroPadding: 16,
    contentMaxWidth: 390,
    narrowMaxWidth: 390,
    sectionGap: 16,
    availableWidth: 358,
    getGridColumns: jest.fn(),
    getGridItemWidth: jest.fn(),
};

describe('SectionCard', () => {
    beforeEach(() => {
        mockUseResponsiveLayout.mockReturnValue(baseLayout);
    });

    it('renders title and children', () => {
        const { getByText } = render(
            <SectionCard title="Cảm biến">
                <Text>Nội dung</Text>
            </SectionCard>,
        );
        expect(getByText('Cảm biến')).toBeTruthy();
        expect(getByText('Nội dung')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
        const { getByText } = render(
            <SectionCard title="Bãi xe" subtitle="Trạng thái hiện tại">
                <Text>Body</Text>
            </SectionCard>,
        );
        expect(getByText('Trạng thái hiện tại')).toBeTruthy();
    });

    it('renders action button and fires onActionPress', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <SectionCard
                title="Xe đăng ký"
                actionLabel="Xem tất cả"
                onActionPress={onPress}
            >
                <Text>Danh sách</Text>
            </SectionCard>,
        );
        fireEvent.press(getByText('Xem tất cả'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders footer when provided', () => {
        const { getByText } = render(
            <SectionCard title="Thông tin" footer={<Text>Cập nhật lúc 10:00</Text>}>
                <Text>Chi tiết</Text>
            </SectionCard>,
        );
        expect(getByText('Cập nhật lúc 10:00')).toBeTruthy();
    });

    it('renders icon when provided', () => {
        const { getByText } = render(
            <SectionCard title="Nhiệt độ" icon={<Text>🌡</Text>}>
                <Text>29°C</Text>
            </SectionCard>,
        );
        expect(getByText('🌡')).toBeTruthy();
    });

    it('does not render action button when actionLabel is absent', () => {
        const { queryByText } = render(
            <SectionCard title="Trống">
                <Text>Nội dung</Text>
            </SectionCard>,
        );
        expect(queryByText('Xem tất cả')).toBeNull();
    });

    it('stacks the header on phone when subtitle and action are both present', () => {
        const { getByTestId } = render(
            <SectionCard title="Parking" subtitle="Trạng thái bãi xe và cảm biến." actionLabel="Mở" onActionPress={jest.fn()}>
                <Text>Nội dung</Text>
            </SectionCard>,
        );

        const header = getByTestId('section-card-header');
        const actions = getByTestId('section-card-actions');

        expect(header.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ flexDirection: 'column' })]),
        );
        expect(actions.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ alignItems: 'flex-start' })]),
        );
    });
});
