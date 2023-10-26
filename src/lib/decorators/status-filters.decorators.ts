import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';
import { ContractStatus } from '../interfaces/contract-status.enum';
import { DeviceStatus } from '../interfaces/device-status.enum';
import { SubscriptionApplicationStatus } from '../interfaces/subscription-application-status.enum';

export class StatusFilters<T> {
  status: T;
}

export const StatusFiltered = createParamDecorator(
  (
    defaultStatus:
      | ContractStatus
      | DeviceStatus
      | SubscriptionApplicationStatus,
    ctx: ExecutionContext,
  ): StatusFilters<typeof defaultStatus> => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CustomerDocument; roles: string[] }>();

    return request?.query?.status
      ? ({
          status: request?.query?.status,
        } as StatusFilters<typeof defaultStatus>)
      : ({
          status: defaultStatus,
        } as StatusFilters<typeof defaultStatus>);
  },
);
