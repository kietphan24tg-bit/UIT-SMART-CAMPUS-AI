import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsString({ message: 'Mật khẩu hiện tại không hợp lệ.' })
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu hiện tại.' })
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword456' })
  @IsString({ message: 'Mật khẩu mới không hợp lệ.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa và 1 chữ số.',
  })
  newPassword!: string;
}
