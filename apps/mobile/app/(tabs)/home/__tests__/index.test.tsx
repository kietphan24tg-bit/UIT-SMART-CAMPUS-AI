import { render } from '@testing-library/react-native';
import React from 'react';

import { useAuthStore } from '@/stores/auth-store';

import HomeScreen from '../index';

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('HomeScreen', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen' } };
      return selector(state);
    });
  });

  it('should render greeting with user name', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Xin chao, An!')).toBeTruthy();
  });

  it('should render Smart Campus subtitle', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Smart Campus UIT')).toBeTruthy();
  });

  it('should render all quick action cards', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Thoi khoa bieu')).toBeTruthy();
    expect(getByText('Diem / GPA')).toBeTruthy();
    expect(getByText('AI Chatbot')).toBeTruthy();
    expect(getByText('Su kien')).toBeTruthy();
    expect(getByText('Thu vien')).toBeTruthy();
    expect(getByText('Ban do')).toBeTruthy();
  });

  it('should render notifications section', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Thong bao moi')).toBeTruthy();
    expect(getByText('Chua co thong bao moi')).toBeTruthy();
  });

  it('should show fallback name when user is null', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: null };
      return selector(state);
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Xin chao, Sinh vien!')).toBeTruthy();
  });
});
