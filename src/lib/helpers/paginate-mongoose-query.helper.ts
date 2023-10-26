import { FilterQuery, HydratedDocument, Model } from 'mongoose';
import {
  PaginatedResults,
  Pagination,
} from '../decorators/pagination.decorator';
import { SortFilters } from '../decorators/sort-filters.decorators';

export async function paginateMongooseQuery<T>(
  model: Model<T>,
  filters: FilterQuery<T>,
  pagination: Pagination,
  sortFilters: SortFilters,
): Promise<PaginatedResults<HydratedDocument<T>>> {
  const results = await model
    .find(filters)

    .skip(pagination.start)
    .limit(pagination.limit)
    .sort({
      [sortFilters.sort]: sortFilters.order,
    });

  const count = await model.count(filters);

  return {
    results,
    count,
    limit: pagination.limit,
    start: pagination.start,
  };
}
