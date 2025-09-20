import { PrismaClient, PostStatus, MediaType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define interfaces for translations
interface CategoryTranslation {
  locale: string;
  name: string;
  description?: string;
  slug: string;
  dir?: string;
}

interface PostTranslation {
  locale: string;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  dir?: string;
}

async function main() {
  console.log('Starting database seeding...');

  // Get admin credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@phoenix.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create default super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      firstNameArabic: 'سوبر',
      lastNameArabic: 'أدمن',
      isActive: true,
      emailVerified: true,
    },
  });

  // Create editor user
  const editor = await prisma.user.upsert({
    where: { email: 'editor@phoenix.com' },
    update: {},
    create: {
      email: 'editor@phoenix.com',
      password: hashedPassword, // Same password for simplicity
      firstName: 'Content',
      lastName: 'Editor',
      firstNameArabic: 'محرر',
      lastNameArabic: 'المحتوى',
      isActive: true,
      emailVerified: true,
    },
  });

  // Create roles
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

  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: {},
    create: {
      name: 'EDITOR',
      nameArabic: 'محرر',
      description: 'Content creation and editing permissions',
      descriptionArabic: 'صلاحيات إنشاء وتحرير المحتوى',
    },
  });

  // Create permissions
  const permissions = [
    { name: 'view_dashboard', nameArabic: 'عرض لوحة التحكم', description: 'View admin dashboard' },
    { name: 'manage_users', nameArabic: 'إدارة المستخدمين', description: 'Create, edit, delete users' },
    { name: 'manage_roles', nameArabic: 'إدارة الأدوار', description: 'Create, edit, delete roles' },
    { name: 'view_content', nameArabic: 'عرض المحتوى', description: 'View posts and content' },
    { name: 'create_content', nameArabic: 'إنشاء المحتوى', description: 'Create new posts' },
    { name: 'edit_content', nameArabic: 'تحرير المحتوى', description: 'Edit existing posts' },
    { name: 'delete_content', nameArabic: 'حذف المحتوى', description: 'Delete posts' },
    { name: 'publish_content', nameArabic: 'نشر المحتوى', description: 'Publish posts' },
    { name: 'manage_categories', nameArabic: 'إدارة الفئات', description: 'Manage post categories' },
    { name: 'view_categories', nameArabic: 'عرض الفئات', description: 'View categories' },
    { name: 'manage_media', nameArabic: 'إدارة الوسائط', description: 'Upload and manage media files' },
    { name: 'view_analytics', nameArabic: 'عرض التحليلات', description: 'View site analytics' },
    { name: 'manage_settings', nameArabic: 'إدارة الإعدادات', description: 'Change system settings' },
    { name: 'manage_authors', nameArabic: 'إدارة الكتاب', description: 'Manage authors' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Assign all permissions to super admin
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }

  // Assign content permissions to editor
  const editorPermissions = allPermissions.filter(p => 
    ['view_dashboard', 'view_content', 'create_content', 'edit_content', 'view_categories', 'manage_media', 'manage_authors'].includes(p.name)
  );
  for (const permission of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: editorRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: editorRole.id, permissionId: permission.id },
    });
  }

  // Assign roles to users
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: editor.id, roleId: editorRole.id } },
    update: {},
    create: { userId: editor.id, roleId: editorRole.id },
  });

  // Create sample authors
  const authors = [
    {
      id: 'super-admin-author',
      nameEn: 'Haidar Husseini',
      nameAr: 'حيدر الحسيني',
      country: 'Lebanon',
      bio: 'Chief editor and system administrator with over 10 years of experience in digital journalism',
      bioAr: 'رئيس التحرير ومدير النظام مع أكثر من 10 سنوات من الخبرة في الصحافة الرقمية',
      email: adminEmail,
      isActive: true,
    }
  ]

  for (const author of authors) {
    await prisma.author.upsert({
      where: { id: author.id },
      update: {},
      create: author,
    });
  }

  // Create sample tags
  const tags = [
    { name: 'Politics', nameArabic: 'سياسة' },
    { name: 'Technology', nameArabic: 'تكنولوجيا' },
    { name: 'Business', nameArabic: 'أعمال' },
    { name: 'Sports', nameArabic: 'رياضة' },
    { name: 'Culture', nameArabic: 'ثقافة' },
    { name: 'Local', nameArabic: 'محلي' },
    { name: 'International', nameArabic: 'دولي' },
    { name: 'Economy', nameArabic: 'اقتصاد' },
    { name: 'Opinion', nameArabic: 'رأي' },
    { name: 'Breaking', nameArabic: 'عاجل' },
    { name: 'Analysis', nameArabic: 'تحليل' },
    { name: 'Innovation', nameArabic: 'ابتكار' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  // Create categories
  const categories = [
    {
      slug: 'economy',
      order: 1,
      translations: [
        { locale: 'en', name: 'Economy', description: 'Economic news and analysis', slug: 'economy' },
        { locale: 'ar', name: 'اقتصاد', description: 'الأخبار والتحليلات الاقتصادية', slug: 'economy-ar', dir: 'rtl' },
      ],
      children: [
        {
          slug: 'markets',
          order: 1,
          translations: [
            { locale: 'en', name: 'Markets', description: 'Financial markets and trading', slug: 'markets' },
            { locale: 'ar', name: 'أسواق', description: 'الأسواق المالية والتداول', slug: 'markets-ar', dir: 'rtl' },
          ],
        },
        {
          slug: 'energy',
          order: 2,
          translations: [
            { locale: 'en', name: 'Energy', description: 'Energy sector news and analysis', slug: 'energy' },
            { locale: 'ar', name: 'طاقة', description: 'أخبار وتحليلات قطاع الطاقة', slug: 'energy-ar', dir: 'rtl' },
          ],
        },
        {
          slug: 'real-estate',
          order: 3,
          translations: [
            { locale: 'en', name: 'Real Estate', description: 'Real estate market news', slug: 'real-estate' },
            { locale: 'ar', name: 'عقارات', description: 'أخبار سوق العقارات', slug: 'real-estate-ar', dir: 'rtl' },
          ],
        },
      ],
    },
    {
      slug: 'business',
      order: 2,
      translations: [
        { locale: 'en', name: 'Business', description: 'Business news and analysis', slug: 'business' },
        { locale: 'ar', name: 'بزنس', description: 'أخبار وتحليلات الأعمال', slug: 'business-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'technology',
      order: 3,
      translations: [
        { locale: 'en', name: 'Technology', description: 'Technology news and innovations', slug: 'technology' },
        { locale: 'ar', name: 'تكنولوجيا', description: 'أخبار التكنولوجيا والابتكارات', slug: 'technology-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'tourism',
      order: 4,
      translations: [
        { locale: 'en', name: 'Tourism', description: 'Tourism and travel news', slug: 'tourism' },
        { locale: 'ar', name: 'سياحة', description: 'أخبار السياحة والسفر', slug: 'tourism-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'automotive',
      order: 5,
      translations: [
        { locale: 'en', name: 'Automotive', description: 'Automotive industry news', slug: 'automotive' },
        { locale: 'ar', name: 'سيارات', description: 'أخبار صناعة السيارات', slug: 'automotive-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'opinion',
      order: 6,
      translations: [
        { locale: 'en', name: 'Opinion', description: 'Opinion articles and editorials', slug: 'opinion' },
        { locale: 'ar', name: 'مقالات', description: 'مقالات الرأي والافتتاحيات', slug: 'opinion-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'did-you-know',
      order: 7,
      translations: [
        { locale: 'en', name: 'Did You Know?', description: 'Interesting facts and trivia', slug: 'did-you-know' },
        { locale: 'ar', name: 'هل تعلم؟', description: 'حقائق مثيرة ومعلومات عامة', slug: 'did-you-know-ar', dir: 'rtl' },
      ],
    },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const { translations, children, ...categoryData } = category;
    
    const createdCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: categoryData,
    });
    
    createdCategories.push(createdCategory);

    // Create category translations
    for (const translation of translations) {
      await prisma.categoryTranslation.upsert({
        where: { slug: translation.slug },
        update: {},
        create: {
          categoryId: createdCategory.id,
          locale: translation.locale,
          name: translation.name,
          description: translation.description,
          slug: translation.slug,
          dir: translation.dir || 'ltr',
        },
      });
    }

    // Create child categories if they exist
    if (children) {
      for (const child of children) {
        const { translations: childTranslations, ...childData } = child;
        
        const createdChild = await prisma.category.upsert({
          where: { slug: child.slug },
          update: {},
          create: {
            ...childData,
            parentId: createdCategory.id,
          },
        });

        // Create child category translations
        for (const translation of childTranslations) {
          await prisma.categoryTranslation.upsert({
            where: { slug: translation.slug },
            update: {},
            create: {
              categoryId: createdChild.id,
              locale: translation.locale,
              name: translation.name,
              description: translation.description,
              slug: translation.slug,
              dir: translation.dir || 'ltr',
            },
          });
        }
      }
    }
  }


  console.log('Seeding completed successfully');
  console.log(`Super Admin Email: ${adminEmail}`);
  console.log(`Super Admin Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 