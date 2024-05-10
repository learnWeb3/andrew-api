import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateDeviceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  customer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  vehicle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  contract: string;
}
