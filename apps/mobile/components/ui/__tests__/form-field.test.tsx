import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { FormField } from '../form-field';

describe('FormField', () => {
  it('supports secure text visibility toggle', () => {
    const { getByLabelText } = render(
      <FormField
        label="Mật khẩu"
        value="Password123"
        onChangeText={jest.fn()}
        secureTextEntry
        secureToggle
      />,
    );

    fireEvent.press(getByLabelText('Hiện mật khẩu'));

    expect(getByLabelText('Ẩn mật khẩu')).toBeTruthy();
  });
});
