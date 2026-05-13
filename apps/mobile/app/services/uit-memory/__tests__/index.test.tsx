import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';

import UitMemoryGameScreen from '../index';

import { getUitMemoryRoundOptions } from '@/constants/uit-memory-game';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

describe('UitMemoryGameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first round and advances after a correct match', () => {
    render(<UitMemoryGameScreen />);

    expect(screen.getByText('Ghép ảnh UIT xưa và nay')).toBeTruthy();
    fireEvent.press(screen.getByTestId('uit-memory-option-1'));

    expect(screen.getByText('Ghép đúng rồi')).toBeTruthy();
    fireEvent.press(screen.getByText('Lượt tiếp theo'));

    expect(screen.getByText('Chọn cặp đúng')).toBeTruthy();
    expect(screen.getByText('Điểm 1/4')).toBeTruthy();
  });

  it('shows the correct pair reveal after a wrong answer', () => {
    render(<UitMemoryGameScreen />);

    fireEvent.press(screen.getByTestId('uit-memory-option-2'));

    expect(screen.getByText('Cặp đúng là đây')).toBeTruthy();
    expect(screen.getByText('Quá khứ')).toBeTruthy();
    expect(screen.getByText('Hiện tại')).toBeTruthy();
  });

  it('keeps the option order fixed from 1 to 4', () => {
    expect(getUitMemoryRoundOptions().map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it('renders options in a fixed 2x2 grid', () => {
    render(<UitMemoryGameScreen />);

    const firstRow = screen.getByTestId('uit-memory-option-row-1');
    const secondRow = screen.getByTestId('uit-memory-option-row-2');

    expect(within(firstRow).getByTestId('uit-memory-option-1')).toBeTruthy();
    expect(within(firstRow).getByTestId('uit-memory-option-2')).toBeTruthy();
    expect(within(secondRow).getByTestId('uit-memory-option-3')).toBeTruthy();
    expect(within(secondRow).getByTestId('uit-memory-option-4')).toBeTruthy();
  });
});
