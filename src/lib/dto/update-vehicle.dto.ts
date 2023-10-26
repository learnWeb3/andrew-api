import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Matches(/^vehicle\/driver\-license\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of vehicle/driver-license/<filename>',
  })
  driverLicenceDocURL: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Matches(/^vehicle\/registration\-card\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of vehicle/registration-card/<filename>',
  })
  vehicleRegistrationCardDocURL: string;
}
