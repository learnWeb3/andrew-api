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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContactInformationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateBillingInformationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPostalCode('FR')
  postCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdatePaymentInformationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ecommerceCustomer: string;
}

export class UpdateIdentityDocsDto {
  @ApiPropertyOptional({ format: '/customer/identity-id-card/.*' })
  @IsOptional()
  @Matches(/^customer\/identity\/id\-card\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of customer/identity/id-card/<filename>',
  })
  idCardDocURL?: string;

  @ApiPropertyOptional({ format: '/customer/identity-residency-proof/.*' })
  @IsOptional()
  @Matches(/^customer\/identity\/residency\-proof\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of customer/identity/residency-proof/<filename>',
  })
  residencyProofDocURL?: string;
}

export class UpdatePaymentDocDto {
  @ApiPropertyOptional({ format: '/customer/payments-terms-of-sales/.*' })
  @IsOptional()
  @Matches(/^customer\/payments\/terms\-of\-sales\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of customer/payments/terms-of-sales/<filename>',
  })
  termsOfSaleDocURL?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({ type: UpdateContactInformationsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInformationsDto)
  contactInformations: Partial<UpdateContactInformationsDto>;

  @ApiPropertyOptional({ type: UpdateBillingInformationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBillingInformationDto)
  billingInformations: Partial<UpdateBillingInformationDto>;

  @ApiPropertyOptional({ type: UpdatePaymentInformationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePaymentInformationDto)
  paymentInformations: Partial<UpdatePaymentInformationDto>;

  @ApiPropertyOptional({ type: UpdateIdentityDocsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIdentityDocsDto)
  identityDocs: Partial<UpdateIdentityDocsDto>;

  @ApiPropertyOptional({ type: UpdatePaymentDocDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePaymentDocDto)
  paymentDocs: Partial<UpdatePaymentDocDto>;
}
