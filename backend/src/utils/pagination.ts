import { Document, Model, FilterQuery } from 'mongoose';

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export async function paginateResults<T extends Document>(
  model: Model<T>,
  query: FilterQuery<T>,
  options: PaginationParams = {}
): Promise<PaginatedResponse<T>> {
  const {
    cursor,
    limit = 20,
    sortField = '_id',
    sortOrder = 'asc'
  } = options;

  // Apply cursor if provided
  if (cursor) {
    const operator = sortOrder === 'asc' ? '$gt' : '$lt';
    query[sortField] = { [operator]: cursor };
  }

  // Fetch one extra to check if there are more results
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const data = await model
    .find(query)
    .sort({ [sortField]: sortDirection })
    .limit(limit + 1)
    .lean();

  // Check if there are more results
  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  // Get next cursor
  const nextCursor = hasMore && results.length > 0
    ? results[results.length - 1][sortField as keyof T]?.toString() || null
    : null;

  return {
    data: results as T[],
    nextCursor,
    hasMore,
  };
}

export interface OffsetPaginationParams {
  page?: number;
  limit?: number;
}

export interface OffsetPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginateWithOffset<T extends Document>(
  model: Model<T>,
  query: FilterQuery<T>,
  options: OffsetPaginationParams = {}
): Promise<OffsetPaginatedResponse<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query).skip(skip).limit(limit).lean(),
    model.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as T[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
