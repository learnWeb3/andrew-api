import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';

export interface PaginationWithAfterId {
  limit?: number;
  startAfterId?: string;
}

export const PaginatedWithAfterId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationWithAfterId => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CustomerDocument; roles: string[] }>();

    return {
      limit: +request.query.limit || 10,
      startAfterId: (request.query.after as string) || null,
    };
  },
);
