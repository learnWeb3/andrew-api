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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionApplicationVehicle {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Max(new Date().getFullYear())
  @Min(1900)
  year: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  originalInServiceDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  contractSubscriptionKm: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^vehicle\/driver\-license\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of vehicle/driver-license/<filename>',
  })
  driverLicenceDocURL: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^vehicle\/registration\-card\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of vehicle/registration-card/<filename>',
  })
  vehicleRegistrationCardDocURL: string;
}

export class CreateSubscriptionApplicationContract {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^contract\/contract\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of contract/contract/<filename>',
  })
  contractDocURL: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ecommerceProduct: string;
}

export class CreateSubscriptionApplicationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer: string;

  @ApiPropertyOptional({ type: [CreateSubscriptionApplicationVehicle] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionApplicationVehicle)
  vehicles: CreateSubscriptionApplicationVehicle[];

  @ApiPropertyOptional({ type: [CreateSubscriptionApplicationContract] })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSubscriptionApplicationContract)
  contract: CreateSubscriptionApplicationContract;

  @ApiPropertyOptional({ type: UpdateContactInformationsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInformationsDto)
  contactInformations: UpdateContactInformationsDto;

  @ApiPropertyOptional({ type: UpdateBillingInformationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBillingInformationDto)
  billingInformations: UpdateBillingInformationDto;

  @ApiPropertyOptional({ type: UpdateIdentityDocsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIdentityDocsDto)
  identityDocs: UpdateIdentityDocsDto;

  @ApiPropertyOptional({ type: UpdatePaymentDocDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePaymentDocDto)
  paymentDocs: UpdatePaymentDocDto;
}

export class UserCreateSubscriptionApplicationDto extends OmitType(
  CreateSubscriptionApplicationDto,
  ['customer'],
) {}
