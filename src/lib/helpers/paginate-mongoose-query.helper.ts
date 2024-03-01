import { FilterQuery, HydratedDocument, Model } from 'mongoose';
import {
  PaginatedResults,
  Pagination,
} from '../decorators/pagination.decorator';
import { SortFilters } from '../decorators/sort-filters.decorators';

export async function paginateMongooseQuery<T, P>(
  model: Model<T>,
  filters: FilterQuery<T>,
  pagination: Pagination,
  sortFilters: SortFilters,
  populatePaths: string | string[] = [],
): Promise<PaginatedResults<HydratedDocument<T> & P>> {
  const results: any[] = await model
    .find(filters)
    .populate(populatePaths)
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
