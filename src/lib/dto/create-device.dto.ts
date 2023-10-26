import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  @MinLength(32)
  serialNumber: string;
}
