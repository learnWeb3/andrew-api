import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  customer: string;
  @IsNotEmpty()
  @IsString()
  contract: string;
  @IsNotEmpty()
  @IsString()
  vin: string;
  @IsNotEmpty()
  @IsString()
  brand: string;
  @IsNotEmpty()
  @IsString()
  model: string;
  @IsNotEmpty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Max(new Date().getFullYear())
  @Min(1900)
  year: number;
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;
  @IsNotEmpty()
  @IsDateString()
  originalInServiceDate: Date;

  @IsNotEmpty()
  @IsNumber()
  contractSubscriptionKm: number;

  @IsNotEmpty()
  driverLicenceDocURL: string;

  @IsNotEmpty()
  vehicleRegistrationCardDocURL: string;
}
