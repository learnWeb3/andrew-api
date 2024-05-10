import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ maxLength: 32, minLength: 32 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  @MinLength(32)
  serialNumber: string;
}
