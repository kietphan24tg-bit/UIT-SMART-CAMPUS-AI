import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
    it('renders the label text', () => {
        const { getByText } = render(<StatusBadge label="Hoạt động" />);
        expect(getByText('Hoạt động')).toBeTruthy();
    });

    it('renders with success tone', () => {
        const { getByText } = render(
            <StatusBadge label="Online" tone="success" />,
        );
        expect(getByText('Online')).toBeTruthy();
    });

    it('renders with danger tone', () => {
        const { getByText } = render(
            <StatusBadge label="Lỗi" tone="danger" />,
        );
        expect(getByText('Lỗi')).toBeTruthy();
    });

    it('renders with warning tone', () => {
        const { getByText } = render(
            <StatusBadge label="Cảnh báo" tone="warning" />,
        );
        expect(getByText('Cảnh báo')).toBeTruthy();
    });

    it('renders with solid variant', () => {
        const { getByText } = render(
            <StatusBadge label="Đang xử lý" tone="primary" variant="solid" />,
        );
        expect(getByText('Đang xử lý')).toBeTruthy();
    });

    it('renders with outline variant', () => {
        const { getByText } = render(
            <StatusBadge label="Chờ duyệt" variant="outline" />,
        );
        expect(getByText('Chờ duyệt')).toBeTruthy();
    });

    it('renders with glass variant', () => {
        const { getByText } = render(
            <StatusBadge label="Mới" variant="glass" tone="info" />,
        );
        expect(getByText('Mới')).toBeTruthy();
    });

    it('renders with sm size', () => {
        const { getByText } = render(
            <StatusBadge label="Nhỏ" size="sm" />,
        );
        expect(getByText('Nhỏ')).toBeTruthy();
    });

    it('renders icon alongside label', () => {
        const { getByText } = render(
            <StatusBadge label="Trực tuyến" icon={<Text>●</Text>} tone="success" />,
        );
        expect(getByText('●')).toBeTruthy();
        expect(getByText('Trực tuyến')).toBeTruthy();
    });

    it('does not render icon when not provided', () => {
        const { queryByText } = render(<StatusBadge label="Offline" />);
        expect(queryByText('●')).toBeNull();
        expect(queryByText('Offline')).toBeTruthy();
    });
});
