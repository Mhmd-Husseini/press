import { PrismaClient, Prisma, User } from '@prisma/client';
import { BaseService } from '../base.service';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface UserWithRoles extends User {
  roles: Array<{
    role: {
      id: string;
      name: string;
      nameArabic?: string | null;
      description?: string | null;
      descriptionArabic?: string | null;
      createdAt: Date;
    };
  }>;
}

export class UserService extends BaseService<Prisma.UserDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>> {
  constructor() {
    // Define searchable fields
    super(
      prisma, 
      prisma.user, 
      ['email', 'firstName', 'lastName', 'firstNameArabic', 'lastNameArabic']
    );
  }

  async create(userData: any, roles: string[] = ['USER']): Promise<UserWithRoles> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with roles
    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        roles: {
          create: roles.map(roleName => ({
            role: {
              connectOrCreate: {
                where: { name: roleName },
                create: { name: roleName }
              }
            }
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    }) as Promise<UserWithRoles>;
  }

  async findById(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    }) as Promise<UserWithRoles | null>;
  }

  async update(id: string, userData: any, roles?: string[]): Promise<UserWithRoles | null> {
    // Update user data
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userData,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    }) as UserWithRoles;

    // Update roles if provided
    if (roles && roles.length > 0) {
      // Delete existing roles
      await this.prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Create new roles
      await Promise.all(
        roles.map(roleName =>
          this.prisma.userRole.create({
            data: {
              userId: id,
              role: {
                connectOrCreate: {
                  where: { name: roleName },
                  create: { name: roleName }
                }
              }
            }
          })
        )
      );

      // Get updated user with new roles
      return this.prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      }) as Promise<UserWithRoles | null>;
    }

    return updatedUser;
  }

  async delete(id: string) {
    // Delete user roles first (handle foreign key constraints)
    await this.prisma.userRole.deleteMany({
      where: { userId: id }
    });

    // Delete the user
    return this.prisma.user.delete({
      where: { id }
    });
  }
} 