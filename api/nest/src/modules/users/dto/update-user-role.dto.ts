import { ApiProperty } from '@nestjs/swagger';
import { ACTIVE_USER_ROLES, type ActiveUserRole } from '@smart-campus/shared';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ACTIVE_USER_ROLES })
  @IsNotEmpty()
  @IsIn(ACTIVE_USER_ROLES)
  role!: ActiveUserRole;
}
