import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { SectionCard } from '../section-card';

describe('SectionCard', () => {
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
});
