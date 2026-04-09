import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES } from '@smart-campus/shared';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Object.values(USER_ROLES) })
  @IsNotEmpty()
  @IsIn(Object.values(USER_ROLES))
  role!: (typeof USER_ROLES)[keyof typeof USER_ROLES];
}
