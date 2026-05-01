import { render } from '@testing-library/react-native';
import React from 'react';

import { InfoRow } from '../info-row';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as jest.Mock;

const baseLayout = {
    viewportWidth: 390,
    viewportHeight: 844,
    isCompact: false,
    isRegularPhone: false,
    isWidePhone: true,
    isLargePhone: false,
    isExtraLargePhone: false,
    isTablet: false,
    isLargeScreen: false,
    horizontalPadding: 18,
    heroPadding: 18,
    contentMaxWidth: 390,
    narrowMaxWidth: 390,
    sectionGap: 18,
    availableWidth: 354,
    getGridColumns: jest.fn(),
    getGridItemWidth: jest.fn(),
};

describe('InfoRow', () => {
    it('keeps a single-line value on wider phones', () => {
        mockUseResponsiveLayout.mockReturnValue(baseLayout);

        const { getByText } = render(
            <InfoRow label="Tiếp nhận" value="Qua email hỗ trợ chính thức" />,
        );

        expect(getByText('Qua email hỗ trợ chính thức').props.numberOfLines).toBe(1);
    });

    it('allows up to two lines on compact phones without middle ellipsis', () => {
        mockUseResponsiveLayout.mockReturnValue({
            ...baseLayout,
            isWidePhone: false,
            isRegularPhone: true,
        });

        const { getByTestId, getByText } = render(
            <InfoRow
                label="Tiếp nhận"
                value="Qua email hỗ trợ chính thức"
            />,
        );

        const row = getByTestId('info-row');
        const value = getByText('Qua email hỗ trợ chính thức');

        expect(row.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ alignItems: 'flex-start' })]),
        );
        expect(value.props.numberOfLines).toBe(2);
        expect(value.props.ellipsizeMode).toBeUndefined();
    });
});
