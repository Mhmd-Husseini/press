import { BaseService } from '@/lib/base.service';
import prisma from '@/lib/prisma';
import { User, Prisma } from '@prisma/client';

export class UserService extends BaseService<User> {
  constructor() {
    super(prisma, prisma.user, ['email', 'firstName', 'lastName']);
  }

  async findById(id: string) {
    return this.model.findUnique({
      where: { id }
    });
  }

  async update(id: string, data: Partial<User>) {
    return this.model.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.model.delete({
      where: { id }
    });
  }
} 