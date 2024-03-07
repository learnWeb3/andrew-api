import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateDeviceDto {
  @IsOptional()
  @IsNotEmpty()
  customer: string;

  @IsOptional()
  @IsNotEmpty()
  vehicle: string;

  @IsOptional()
  @IsNotEmpty()
  contract: string;
}
