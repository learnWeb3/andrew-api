import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UpdateBillingInformationDto,
  UpdateContactInformationsDto,
  UpdateIdentityDocsDto,
  UpdatePaymentDocDto,
} from './update-customer.dto';
import { OmitType } from '@nestjs/mapped-types';

export class CreateSubscriptionApplicationVehicle {
  @IsOptional()
  @IsString()
  vin: string;
  @IsOptional()
  @IsString()
  brand: string;
  @IsOptional()
  @IsString()
  model: string;
  @IsOptional()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Max(new Date().getFullYear())
  @Min(1900)
  year: number;
  @IsOptional()
  @IsString()
  registrationNumber: string;
  @IsOptional()
  @IsDateString()
  originalInServiceDate: Date;

  @IsOptional()
  @IsNumber()
  contractSubscriptionKm: number;

  @IsOptional()
  @IsString()
  @Matches(/^vehicle\/driver\-license\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of vehicle/driver-license/<filename>',
  })
  driverLicenceDocURL: string;

  @IsOptional()
  @IsString()
  @Matches(/^vehicle\/registration\-card\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of vehicle/registration-card/<filename>',
  })
  vehicleRegistrationCardDocURL: string;
}

export class CreateSubscriptionApplicationContract {
  @IsOptional()
  @IsString()
  @Matches(/^contract\/contract\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of contract/contract/<filename>',
  })
  contractDocURL: string;

  @IsOptional()
  @IsString()
  ecommerceProduct: string;
}

export class CreateSubscriptionApplicationDto {
  @IsOptional()
  @IsString()
  customer: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionApplicationVehicle)
  vehicles: CreateSubscriptionApplicationVehicle[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSubscriptionApplicationContract)
  contract: CreateSubscriptionApplicationContract;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInformationsDto)
  contactInformations: UpdateContactInformationsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBillingInformationDto)
  billingInformations: UpdateBillingInformationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIdentityDocsDto)
  identityDocs: UpdateIdentityDocsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePaymentDocDto)
  paymentDocs: UpdatePaymentDocDto;
}

export class UserCreateSubscriptionApplicationDto extends OmitType(
  CreateSubscriptionApplicationDto,
  ['customer'],
) {}
