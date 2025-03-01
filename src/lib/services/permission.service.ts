import { PrismaClient, Prisma, Permission } from '@prisma/client';
import { BaseService } from '../base.service';
import prisma from '@/lib/prisma';

export class PermissionService extends BaseService<Prisma.PermissionDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>> {
  constructor() {
    // Define searchable fields
    super(
      prisma, 
      prisma.permission, 
      ['name', 'nameArabic', 'description', 'descriptionArabic']
    );
  }

  async create(data: { 
    name: string;
    nameArabic?: string;
    description?: string;
    descriptionArabic?: string;
  }): Promise<Permission> {
    // Check if permission already exists
    const exists = await this.prisma.permission.findUnique({
      where: { name: data.name }
    });

    if (exists) {
      throw new Error(`Permission '${data.name}' already exists`);
    }

    return this.prisma.permission.create({
      data
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name }
    });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id }
    });
  }

  async getAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Permission> {
    // First remove all role associations
    await this.prisma.rolePermission.deleteMany({
      where: { permissionId: id }
    });
    
    return this.prisma.permission.delete({
      where: { id }
    });
  }
} 