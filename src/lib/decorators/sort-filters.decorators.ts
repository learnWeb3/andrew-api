import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { SortOrder } from 'mongoose';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';

export interface SortFilters {
  order?: SortOrder;
  sort?: string;
}

export const SortFiltered = createParamDecorator(
  (sortFilters: SortFilters, ctx: ExecutionContext): SortFilters => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CustomerDocument; roles: string[] }>();

    return {
      order: (+request?.query?.order as SortOrder) || sortFilters?.order || -1,
      sort:
        (request?.query?.sort as string) || sortFilters?.sort || 'createdAt',
    };
  },
);
