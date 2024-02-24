import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionApplicationDto } from './create-subscription-application.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { SubscriptionApplicationStatus } from '../interfaces/subscription-application-status.enum';

export class UpdateSubscriptionApplicationDto extends PartialType(
  CreateSubscriptionApplicationDto,
) {}

export class UpdateSubscriptionApplicationStatusDto {
  @IsEnum(SubscriptionApplicationStatus)
  status: SubscriptionApplicationStatus;
  @IsOptional()
  comment?: string;
}

export class FinalizeSubscriptionApplicationDto {
  @IsEnum([
    SubscriptionApplicationStatus.PAYMENT_PENDING,
    SubscriptionApplicationStatus.REJECTED,
    SubscriptionApplicationStatus.TO_AMMEND,
  ])
  status: SubscriptionApplicationStatus;

  @IsOptional()
  comment?: string;
}
