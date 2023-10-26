import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';

export const SearchValue = createParamDecorator(
  (value: string, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CustomerDocument; roles: string[] }>();

    return (request?.query?.value as string) || '';
  },
);
