import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionApplicationDto } from './create-subscription-application.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { SubscriptionApplicationStatus } from '../interfaces/subscription-application-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionApplicationDto extends PartialType(
  CreateSubscriptionApplicationDto,
) {}

export class UpdateSubscriptionApplicationStatusDto {
  @ApiProperty({ enum: SubscriptionApplicationStatus })
  @IsEnum(SubscriptionApplicationStatus)
  status: SubscriptionApplicationStatus;
  @ApiPropertyOptional()
  @IsOptional()
  comment?: string;
}

export class FinalizeSubscriptionApplicationDto {
  @ApiProperty({
    enum: [
      SubscriptionApplicationStatus.PAYMENT_PENDING,
      SubscriptionApplicationStatus.REJECTED,
      SubscriptionApplicationStatus.TO_AMMEND,
    ],
  })
  @IsEnum([
    SubscriptionApplicationStatus.PAYMENT_PENDING,
    SubscriptionApplicationStatus.REJECTED,
    SubscriptionApplicationStatus.TO_AMMEND,
  ])
  status: SubscriptionApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  comment?: string;
}
