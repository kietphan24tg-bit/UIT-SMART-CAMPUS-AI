import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../buttons';

describe('PrimaryButton', () => {
    it('renders the label text', () => {
        const { getByText } = render(<PrimaryButton label="Đăng nhập" />);
        expect(getByText('Đăng nhập')).toBeTruthy();
    });

    it('keeps the primary label on a single line', () => {
        const { getByText } = render(<PrimaryButton label="Đăng nhập" />);
        expect(getByText('Đăng nhập').props.numberOfLines).toBe(1);
    });

    it('shows a loading indicator and hides label when loading', () => {
        const { queryByText } = render(
            <PrimaryButton label="Đăng nhập" loading />,
        );
        expect(queryByText('Đăng nhập')).toBeNull();
    });

    it('calls onPress when pressed', () => {
        const onPress = jest.fn();
        const { getByRole } = render(
            <PrimaryButton label="Xác nhận" onPress={onPress} />,
        );
        fireEvent.press(getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByRole } = render(
            <PrimaryButton label="Xác nhận" onPress={onPress} disabled />,
        );
        fireEvent.press(getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('renders an icon alongside the label', () => {
        const { getByText } = render(
            <PrimaryButton label="Tiếp tục" icon={<Text>→</Text>} />,
        );
        expect(getByText('→')).toBeTruthy();
        expect(getByText('Tiếp tục')).toBeTruthy();
    });
});

describe('SecondaryButton', () => {
    it('renders the label text', () => {
        const { getByText } = render(<SecondaryButton label="Hủy" />);
        expect(getByText('Hủy')).toBeTruthy();
    });

    it('keeps the secondary label on a single line', () => {
        const { getByText } = render(<SecondaryButton label="Quay lại" />);
        expect(getByText('Quay lại').props.numberOfLines).toBe(1);
    });

    it('shows a loading indicator and hides label when loading', () => {
        const { queryByText } = render(
            <SecondaryButton label="Hủy" loading />,
        );
        expect(queryByText('Hủy')).toBeNull();
    });

    it('calls onPress when pressed', () => {
        const onPress = jest.fn();
        const { getByRole } = render(
            <SecondaryButton label="Quay lại" onPress={onPress} />,
        );
        fireEvent.press(getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByRole } = render(
            <SecondaryButton label="Quay lại" onPress={onPress} disabled />,
        );
        fireEvent.press(getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });
});
