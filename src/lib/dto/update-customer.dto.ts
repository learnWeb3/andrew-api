import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsPostalCode,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateContactInformationsDto {
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateBillingInformationDto {
  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsPostalCode('FR')
  postCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdatePaymentInformationDto {
  @IsOptional()
  @IsString()
  ecommerceCustomer: string;
}

export class UpdateIdentityDocsDto {
  @IsOptional()
  @Matches(/^customer\/identity\/id\-card\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of customer/identity/id-card/<filename>',
  })
  idCardDocURL?: string;

  @IsOptional()
  @Matches(/^customer\/identity\/residency\-proof\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of customer/identity/residency-proof/<filename>',
  })
  residencyProofDocURL?: string;
}

export class UpdatePaymentDocDto {
  @IsOptional()
  @Matches(/^customer\/payments\/terms\-of\-sales\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of customer/payments/terms-of-sales/<filename>',
  })
  termsOfSaleDocURL?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInformationsDto)
  contactInformations: Partial<UpdateContactInformationsDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBillingInformationDto)
  billingInformations: Partial<UpdateBillingInformationDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePaymentInformationDto)
  paymentInformations: Partial<UpdatePaymentInformationDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIdentityDocsDto)
  identityDocs: Partial<UpdateIdentityDocsDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePaymentDocDto)
  paymentDocs: Partial<UpdatePaymentDocDto>;
}
