import { PrismaClient } from '@prisma/client';
import { QueryBuilder, QueryParams } from './query-builder';

export class BaseService<T> {
  protected prisma: PrismaClient;
  protected model: any;
  protected searchFields: (keyof T)[];

  constructor(prisma: PrismaClient, model: any, searchFields: (keyof T)[]) {
    this.prisma = prisma;
    this.model = model;
    this.searchFields = searchFields;
  }

  async findAll(params: QueryParams) {
    const queryBuilder = new QueryBuilder<T>(this.searchFields);
    const query = queryBuilder.build(params);

    const [data, total] = await Promise.all([
      this.model.findMany(query),
      this.model.count({ where: query.where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(params.page) || 1,
        limit: Number(params.limit) || 10,
        totalPages: Math.ceil(total / (Number(params.limit) || 10)),
      },
    };
  }
} 