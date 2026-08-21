import { validate } from 'class-validator';

import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('returns Vietnamese validation messages for invalid login payloads', async () => {
    const dto = new LoginDto();
    dto.email = 'student';
    dto.password = 'wrong';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('Email không đúng định dạng.');
    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
  });
});
