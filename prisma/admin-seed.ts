import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting admin seeding...');

  // Admin credentials
  const adminEmail = 'haydar@ektisadi.com';
  const adminPassword = 'haydarhaydar4';
  
  // Hash the password using the same method as the main seeder
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword, // Update password in case user exists
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Haydar',
      lastName: 'Husseini',
      firstNameArabic: 'حيدر',
      lastNameArabic: 'الحسيني',
      isActive: true,
      emailVerified: true,
    },
  });

  // Get or create SUPER_ADMIN role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      nameArabic: 'مدير عام',
      description: 'Full system access with all permissions',
      descriptionArabic: 'الوصول الكامل للنظام مع جميع الصلاحيات',
    },
  });

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();
  
  // Assign all permissions to super admin role
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }

  // Assign SUPER_ADMIN role to the user
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  console.log('Admin seeding completed successfully');
  console.log(`Super Admin Email: ${adminEmail}`);
  console.log(`Super Admin Password: ${adminPassword}`);
  console.log(`User ID: ${superAdmin.id}`);
}

main()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
