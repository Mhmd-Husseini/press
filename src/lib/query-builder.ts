import { Prisma } from '@prisma/client';

export type QueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
};

export class QueryBuilder<T> {
  private query: any = {};
  private searchFields: (keyof T)[] = [];

  constructor(searchFields: (keyof T)[]) {
    this.searchFields = searchFields;
  }

  paginate(params: QueryParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    return {
      take: limit,
      skip: skip,
    };
  }

  sort(params: QueryParams) {
    if (params.sortBy) {
      return {
        orderBy: {
          [params.sortBy]: params.sortOrder || 'desc',
        },
      };
    }
    return {};
  }

  search(params: QueryParams) {
    if (params.search) {
      return {
        OR: this.searchFields.map((field) => ({
          [field]: { contains: params.search, mode: 'insensitive' },
        })),
      };
    }
    return {};
  }

  filter(params: QueryParams) {
    if (params.filters) {
      return {
        AND: Object.entries(params.filters).map(([key, value]) => ({
          [key]: value,
        })),
      };
    }
    return {};
  }

  build(params: QueryParams) {
    return {
      where: {
        ...this.search(params),
        ...this.filter(params),
      },
      ...this.paginate(params),
      ...this.sort(params),
    };
  }
} 