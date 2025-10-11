/**
 * Permissions-only seeder
 * Only seeds permissions and role-permission assignments
 * 
 * Run with: npx ts-node scripts/seed-permissions.ts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting permissions seeding...');

    // Create permissions
    const permissions = [
      { name: 'view_dashboard', nameArabic: 'عرض لوحة التحكم', description: 'View admin dashboard' },
      { name: 'manage_users', nameArabic: 'إدارة المستخدمين', description: 'Create, edit, delete users' },
      { name: 'manage_roles', nameArabic: 'إدارة الأدوار', description: 'Create, edit, delete roles' },
      { name: 'view_roles', nameArabic: 'عرض الأدوار', description: 'View roles' },
      { name: 'create_roles', nameArabic: 'إنشاء الأدوار', description: 'Create new roles' },
      { name: 'edit_roles', nameArabic: 'تعديل الأدوار', description: 'Edit existing roles' },
      { name: 'delete_roles', nameArabic: 'حذف الأدوار', description: 'Delete roles' },
      { name: 'view_content', nameArabic: 'عرض المحتوى', description: 'View posts and content' },
      { name: 'create_content', nameArabic: 'إنشاء المحتوى', description: 'Create new posts' },
      { name: 'update_content', nameArabic: 'تحديث المحتوى', description: 'Update existing posts' },
      { name: 'delete_content', nameArabic: 'حذف المحتوى', description: 'Delete posts' },
      { name: 'publish_content', nameArabic: 'نشر المحتوى', description: 'Publish posts' },
      { name: 'manage_categories', nameArabic: 'إدارة الفئات', description: 'Manage post categories' },
      { name: 'view_categories', nameArabic: 'عرض الفئات', description: 'View categories' },
      { name: 'manage_media', nameArabic: 'إدارة الوسائط', description: 'Upload and manage media files' },
      { name: 'view_analytics', nameArabic: 'عرض التحليلات', description: 'View site analytics' },
      { name: 'manage_settings', nameArabic: 'إدارة الإعدادات', description: 'Change system settings' },
      { name: 'manage_authors', nameArabic: 'إدارة الكتاب', description: 'Manage authors' },
    ];

    console.log('📝 Creating permissions...');
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      console.log(`✅ Created/verified permission: ${permission.name}`);
    }

    // Find roles
    console.log('🔍 Finding roles...');
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' }
    });

    const editorRole = await prisma.role.findFirst({
      where: { name: 'EDITOR' }
    });

    if (!superAdminRole) {
      console.log('❌ SUPER_ADMIN role not found. Please run full seeder first.');
      return;
    }

    if (!editorRole) {
      console.log('❌ EDITOR role not found. Please run full seeder first.');
      return;
    }

    console.log('✅ Found SUPER_ADMIN role:', superAdminRole.id);
    console.log('✅ Found EDITOR role:', editorRole.id);

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();
    console.log(`📋 Found ${allPermissions.length} permissions`);

    // Assign all permissions to super admin
    console.log('👑 Assigning all permissions to SUPER_ADMIN...');
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { 
          roleId_permissionId: { 
            roleId: superAdminRole.id, 
            permissionId: permission.id 
          } 
        },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: permission.id },
      });
    }
    console.log('✅ SUPER_ADMIN has all permissions');

    // Assign content permissions to editor
    console.log('✏️ Assigning content permissions to EDITOR...');
    const editorPermissions = allPermissions.filter((p: any) => 
      ['view_dashboard', 'view_content', 'create_content', 'update_content', 'view_categories', 'manage_media', 'manage_authors'].includes(p.name)
    );
    
    for (const permission of editorPermissions) {
      await prisma.rolePermission.upsert({
        where: { 
          roleId_permissionId: { 
            roleId: editorRole.id, 
            permissionId: permission.id 
          } 
        },
        update: {},
        create: { roleId: editorRole.id, permissionId: permission.id },
      });
      console.log(`✅ Assigned ${permission.name} to EDITOR`);
    }

    console.log('🎉 Permissions seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created/verified ${permissions.length} permissions`);
    console.log(`   - SUPER_ADMIN has ${allPermissions.length} permissions`);
    console.log(`   - EDITOR has ${editorPermissions.length} permissions`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
