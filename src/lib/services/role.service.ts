import { PrismaClient, Prisma, Role } from '@prisma/client';
import { BaseService } from '../base.service';
import prisma from '@/lib/prisma';

export interface RoleWithPermissions extends Role {
  permissions: Array<{
    permission: {
      id: string;
      name: string;
      nameArabic?: string | null;
      description?: string | null;
      descriptionArabic?: string | null;
      createdAt: Date;
    };
  }>;
}

export class RoleService extends BaseService<Prisma.RoleDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>> {
  constructor() {
    // Define searchable fields
    super(
      prisma, 
      prisma.role, 
      ['name', 'nameArabic', 'description', 'descriptionArabic']
    );
  }

  async create(data: { 
    name: string;
    nameArabic?: string;
    description?: string;
    descriptionArabic?: string;
  }, permissions: string[] = []): Promise<RoleWithPermissions> {
    // Check if role already exists
    const exists = await this.prisma.role.findUnique({
      where: { name: data.name }
    });

    if (exists) {
      throw new Error(`Role '${data.name}' already exists`);
    }

    // Create role with permissions
    return this.prisma.role.create({
      data: {
        ...data,
        permissions: {
          create: permissions.map(permissionName => ({
            permission: {
              connectOrCreate: {
                where: { name: permissionName },
                create: { name: permissionName }
              }
            }
          }))
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    }) as Promise<RoleWithPermissions>;
  }

  async findById(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    }) as Promise<RoleWithPermissions | null>;
  }

  async findByName(name: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    }) as Promise<RoleWithPermissions | null>;
  }

  async getAll(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: 'asc' }
    }) as Promise<RoleWithPermissions[]>;
  }

  async update(id: string, data: Partial<Role>, permissions?: string[]): Promise<RoleWithPermissions | null> {
    // Update role data
    const updatedRole = await this.prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    }) as RoleWithPermissions;

    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Create new permissions
      if (permissions.length > 0) {
        await Promise.all(
          permissions.map(permissionName =>
            this.prisma.rolePermission.create({
              data: {
                roleId: id,
                permission: {
                  connectOrCreate: {
                    where: { name: permissionName },
                    create: { name: permissionName }
                  }
                }
              }
            })
          )
        );
      }

      // Get updated role with new permissions
      return this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }) as Promise<RoleWithPermissions | null>;
    }

    return updatedRole;
  }

  async delete(id: string): Promise<Role> {
    // First remove all user and permission associations
    await this.prisma.userRole.deleteMany({
      where: { roleId: id }
    });

    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id }
    });
    
    return this.prisma.role.delete({
      where: { id }
    });
  }

  async hasPermission(roleId: string, permissionName: string): Promise<boolean> {
    const roleWithPermission = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        permissions: {
          some: {
            permission: {
              name: permissionName
            }
          }
        }
      }
    });

    return !!roleWithPermission;
  }
} 