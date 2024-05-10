import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customer: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contract: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vin: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  brand: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  model: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Max(new Date().getFullYear())
  @Min(1900)
  year: number;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  originalInServiceDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  contractSubscriptionKm: number;

  @ApiProperty()
  @IsNotEmpty()
  driverLicenceDocURL: string;

  @ApiProperty()
  @IsNotEmpty()
  vehicleRegistrationCardDocURL: string;
}
