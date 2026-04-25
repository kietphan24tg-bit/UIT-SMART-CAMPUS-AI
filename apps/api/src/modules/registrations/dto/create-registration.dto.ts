import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'Class section id to register',
    example: 'class-section-123',
  })
  @IsString()
  classSectionId!: string;
}

