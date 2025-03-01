import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create base permissions
  const permissions = [
    // User management
    { name: 'view_users', description: 'Can view users' },
    { name: 'create_users', description: 'Can create users' },
    { name: 'edit_users', description: 'Can edit users' },
    { name: 'delete_users', description: 'Can delete users' },
    
    // Role management
    { name: 'view_roles', description: 'Can view roles' },
    { name: 'create_roles', description: 'Can create roles' },
    { name: 'edit_roles', description: 'Can edit roles' },
    { name: 'delete_roles', description: 'Can delete roles' },
    
    // Permission management
    { name: 'view_permissions', description: 'Can view permissions' },
    { name: 'assign_permissions', description: 'Can assign permissions to roles' },
    
    // Content management
    { name: 'view_content', description: 'Can view content' },
    { name: 'create_content', description: 'Can create content' },
    { name: 'edit_content', description: 'Can edit content' },
    { name: 'delete_content', description: 'Can delete content' },
    { name: 'publish_content', description: 'Can publish content' },
    
    // Category management
    { name: 'view_categories', description: 'Can view categories' },
    { name: 'create_categories', description: 'Can create categories' },
    { name: 'edit_categories', description: 'Can edit categories' },
    { name: 'delete_categories', description: 'Can delete categories' },
    
    // Comment management
    { name: 'view_comments', description: 'Can view comments' },
    { name: 'create_comments', description: 'Can create comments' },
    { name: 'edit_comments', description: 'Can edit comments' },
    { name: 'delete_comments', description: 'Can delete comments' },
    { name: 'approve_comments', description: 'Can approve comments' },
    
    // Settings management
    { name: 'manage_settings', description: 'Can manage system settings' },
    
    // Media management
    { name: 'upload_media', description: 'Can upload media' },
    { name: 'manage_media', description: 'Can manage media' },
  ];

  // Create all permissions
  console.log('Creating permissions...');
  const createdPermissions = [];
  
  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    createdPermissions.push(createdPermission);
  }
  
  // Create roles
  console.log('Creating roles...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full access',
    },
  });
  
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with limited admin access',
    },
  });
  
  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: {},
    create: {
      name: 'EDITOR',
      description: 'Editor with content management access',
    },
  });
  
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user with basic access',
    },
  });
  
  // Assign all permissions to SUPER_ADMIN role
  console.log('Assigning permissions to roles...');
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  
  // Assign content management permissions to EDITOR role
  const editorPermissions = [
    'view_content', 'create_content', 'edit_content', 'publish_content',
    'view_categories', 'view_comments', 'create_comments', 'edit_comments',
    'upload_media', 'manage_media'
  ];
  
  for (const permissionName of editorPermissions) {
    const permission = createdPermissions.find(p => p.name === permissionName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: editorRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: editorRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
  
  // Create super admin user
  console.log('Creating super admin user...');
  const hashedPassword = await bcrypt.hash('superadmin@gmail.com', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {},
    create: {
      email: 'superadmin@gmail.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      emailVerified: true,
    },
  });
  
  // Assign SUPER_ADMIN role to super admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });
  
  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 