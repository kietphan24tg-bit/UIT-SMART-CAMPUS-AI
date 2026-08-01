import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';

import {
  AnniversaryCountdownBanner,
  getAnnualAnniversarySnapshot,
  getAnniversaryCountdownSnapshot,
} from '../anniversary-countdown-banner';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as jest.Mock;
const mockUseColorScheme = jest.spyOn(ReactNative, 'useColorScheme');

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

describe('AnniversaryCountdownBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-13T00:00:00+07:00'));
    mockUseResponsiveLayout.mockReturnValue(baseLayout);
    mockUseColorScheme.mockReturnValue('light');
  });

  afterEach(() => {
    jest.useRealTimers();
    mockUseColorScheme.mockReset();
  });

  it('renders the countdown before the anniversary date', () => {
    render(<AnniversaryCountdownBanner />);

    expect(screen.getByText('Đếm ngược tới ngày UIT tròn 20 năm')).toBeTruthy();
    expect(screen.getByText('Sinh nhật UIT vào 08.06.2026')).toBeTruthy();
    expect(screen.getByTestId('anniversary-countdown-days-value')).toHaveTextContent('26');
    expect(screen.getByTestId('anniversary-countdown-hours-value')).toHaveTextContent('00');
    expect(screen.getByTestId('anniversary-countdown-minutes-value')).toHaveTextContent('00');
    expect(screen.getByTestId('anniversary-countdown-seconds-value')).toHaveTextContent('00');
  });

  it('switches to the celebratory state on the anniversary date', () => {
    jest.setSystemTime(new Date('2026-06-08T00:00:00+07:00'));

    render(<AnniversaryCountdownBanner />);

    expect(screen.getByText('Hôm nay UIT tròn 20 năm')).toBeTruthy();
    expect(
      screen.getByText(
        'Hành trình 20 năm UIT đang tiếp tục được viết bằng chính trải nghiệm campus hôm nay.',
      ),
    ).toBeTruthy();
  });

  it('keeps the original slogan and advances only its anniversary year', () => {
    jest.setSystemTime(new Date('2027-06-08T12:00:00+07:00'));

    render(<AnniversaryCountdownBanner />);

    expect(
      screen.getByText(
        'Hành trình 21 năm UIT đang tiếp tục được viết bằng chính trải nghiệm campus hôm nay.',
      ),
    ).toBeTruthy();
  });

  it('keeps target year, age, date, and slogan in phase after the birthday', () => {
    jest.setSystemTime(new Date('2026-06-09T00:00:00+07:00'));

    render(<AnniversaryCountdownBanner />);

    expect(screen.getByText('UIT 21 năm')).toBeTruthy();
    expect(screen.getByText('Đếm ngược tới ngày UIT tròn 21 năm')).toBeTruthy();
    expect(screen.getByText('Sinh nhật UIT vào 08.06.2027')).toBeTruthy();
    expect(screen.getByText('08.06.2027')).toBeTruthy();
    expect(screen.getByText('2027')).toBeTruthy();
    expect(screen.queryByText('Hôm nay UIT tròn 20 năm')).toBeNull();
  });

  it('uses a wrapped 2x2 grid on compact layouts', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...baseLayout,
      viewportWidth: 340,
      isCompact: true,
      isRegularPhone: false,
      availableWidth: 312,
    });

    render(<AnniversaryCountdownBanner />);

    const grid = screen.getByTestId('anniversary-countdown-grid');

    expect(grid.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ flexWrap: 'wrap' })]),
    );
    expect(screen.getByText('Ngày')).toBeTruthy();
    expect(screen.getByText('Giờ')).toBeTruthy();
    expect(screen.getByText('Phút')).toBeTruthy();
    expect(screen.getByText('Giây')).toBeTruthy();
  });

  it('renders safely in dark mode', () => {
    mockUseColorScheme.mockReturnValue('dark');

    render(<AnniversaryCountdownBanner />);

    expect(screen.getByText('Đếm ngược tới ngày UIT tròn 20 năm')).toBeTruthy();
    expect(screen.getByText('08.06.2026')).toBeTruthy();
  });

  it('renders a play button when a callback is provided', () => {
    const onPlayPress = jest.fn();

    render(<AnniversaryCountdownBanner onPlayPress={onPlayPress} />);

    fireEvent.press(screen.getByText('Chơi ghép ảnh UIT'));

    expect(onPlayPress).toHaveBeenCalledTimes(1);
  });
});

describe('getAnnualAnniversarySnapshot', () => {
  it('counts down to the current-year birthday before 08 June in Vietnam', () => {
    const snapshot = getAnnualAnniversarySnapshot(new Date('2026-06-07T23:59:59+07:00'));

    expect(snapshot).toEqual({
      isAnniversaryToday: false,
      targetYear: 2026,
      anniversaryYears: 20,
      targetDateLabel: '08.06.2026',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
    });
  });

  it('uses the celebratory state throughout 08 June in Vietnam', () => {
    expect(getAnnualAnniversarySnapshot(new Date('2026-06-07T17:00:00.000Z'))).toMatchObject({
      isAnniversaryToday: true,
      targetYear: 2026,
      anniversaryYears: 20,
    });
    expect(getAnnualAnniversarySnapshot(new Date('2026-06-08T16:59:59.999Z'))).toMatchObject({
      isAnniversaryToday: true,
      targetYear: 2026,
      anniversaryYears: 20,
    });
  });

  it('rolls every banner value to the following birthday from 09 June in Vietnam', () => {
    const snapshot = getAnnualAnniversarySnapshot(new Date('2026-06-09T00:00:00+07:00'));

    expect(snapshot).toEqual({
      isAnniversaryToday: false,
      targetYear: 2027,
      anniversaryYears: 21,
      targetDateLabel: '08.06.2027',
      days: 364,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('derives future anniversary ages from UIT founding year', () => {
    expect(getAnnualAnniversarySnapshot(new Date('2031-01-01T00:00:00+07:00'))).toMatchObject({
      targetYear: 2031,
      anniversaryYears: 25,
      targetDateLabel: '08.06.2031',
    });
  });
});

describe('getAnniversaryCountdownSnapshot', () => {
  it('keeps the legacy fixed-target helper contract', () => {
    const snapshot = getAnniversaryCountdownSnapshot(new Date('2026-06-08T00:00:01+07:00'));

    expect(snapshot).toEqual({
      isComplete: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
