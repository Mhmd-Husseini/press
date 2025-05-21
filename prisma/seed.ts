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
    { name: 'edit_own_content', description: 'Can edit only own content' },
    { name: 'delete_content', description: 'Can delete content' },
    { name: 'publish_content', description: 'Can publish content' },
    { name: 'approve_content', description: 'Can approve content for publishing' },
    { name: 'decline_content', description: 'Can decline content' },
    { name: 'unpublish_content', description: 'Can unpublish content' },
    
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
  
  // Create Editorial Roles
  const editorInChiefRole = await prisma.role.upsert({
    where: { name: 'EDITOR_IN_CHIEF' },
    update: {},
    create: {
      name: 'EDITOR_IN_CHIEF',
      nameArabic: 'رئيس التحرير',
      description: 'Editor in Chief with full content control',
    },
  });
  
  const editorialRole = await prisma.role.upsert({
    where: { name: 'EDITORIAL' },
    update: {},
    create: {
      name: 'EDITORIAL',
      nameArabic: 'سكرتير التحرير',
      description: 'Editorial secretary with full content management',
    },
  });
  
  const seniorEditorRole = await prisma.role.upsert({
    where: { name: 'SENIOR_EDITOR' },
    update: {},
    create: {
      name: 'SENIOR_EDITOR',
      nameArabic: 'محرر أول',
      description: 'Senior Editor who can approve or decline content',
    },
  });
  
  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: {
      nameArabic: 'محرر',
      description: 'Editor who can create drafts and edit own content',
    },
    create: {
      name: 'EDITOR',
      nameArabic: 'محرر',
      description: 'Editor who can create drafts and edit own content',
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

  // Assign all permissions to Editor in Chief, Editorial, and Senior Editor roles
  const fullEditorialRoles = [editorInChiefRole, editorialRole, seniorEditorRole];
  
  for (const role of fullEditorialRoles) {
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
  
  // Assign limited permissions to EDITOR role
  const editorPermissions = [
    'view_content', 'create_content', 'edit_own_content',
    'view_categories', 'view_comments', 'create_comments',
    'upload_media', 'view_users', 'view_roles', 'view_permissions'
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
  
  // Create users
  console.log('Creating users...');
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
  
  // Create editor-in-chief user
  const editorInChief = await prisma.user.upsert({
    where: { email: 'chief@press.com' },
    update: {},
    create: {
      email: 'chief@press.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'James',
      lastName: 'Smith',
      firstNameArabic: 'جيمس',
      lastNameArabic: 'سميث',
      bio: 'Editor-in-chief with 15 years of journalism experience',
      bioArabic: 'رئيس التحرير مع 15 عامًا من الخبرة الصحفية',
      isActive: true,
      emailVerified: true,
    },
  });
  
  // Create senior editor user
  const seniorEditor = await prisma.user.upsert({
    where: { email: 'senior@press.com' },
    update: {},
    create: {
      email: 'senior@press.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Sarah',
      lastName: 'Johnson',
      firstNameArabic: 'سارة',
      lastNameArabic: 'جونسون',
      bio: 'Senior editor specializing in political news coverage',
      bioArabic: 'محرر أول متخصص في تغطية الأخبار السياسية',
      isActive: true,
      emailVerified: true,
    },
  });
  
  // Create regular editor user
  const editor = await prisma.user.upsert({
    where: { email: 'editor@press.com' },
    update: {},
    create: {
      email: 'editor@press.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Michael',
      lastName: 'Brown',
      firstNameArabic: 'مايكل',
      lastNameArabic: 'براون',
      bio: 'Staff writer covering technology news',
      bioArabic: 'كاتب يغطي أخبار التكنولوجيا',
      isActive: true,
      emailVerified: true,
    },
  });
  
  // Assign roles to users
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
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: editorInChief.id,
        roleId: editorInChiefRole.id,
      },
    },
    update: {},
    create: {
      userId: editorInChief.id,
      roleId: editorInChiefRole.id,
    },
  });
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: seniorEditor.id,
        roleId: seniorEditorRole.id,
      },
    },
    update: {},
    create: {
      userId: seniorEditor.id,
      roleId: seniorEditorRole.id,
    },
  });
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: editor.id,
        roleId: editorRole.id,
      },
    },
    update: {},
    create: {
      userId: editor.id,
      roleId: editorRole.id,
    },
  });
  
  // Create categories
  console.log('Creating categories...');
  const categories = [
    {
      slug: 'politics',
      translations: [
        {
          locale: 'en',
          name: 'Politics',
          description: 'Political news and analysis',
          slug: 'politics',
        },
        {
          locale: 'ar',
          name: 'سياسة',
          description: 'أخبار وتحليلات سياسية',
          slug: 'politics-ar',
          dir: 'rtl',
        }
      ]
    },
    {
      slug: 'technology',
      translations: [
        {
          locale: 'en',
          name: 'Technology',
          description: 'Latest in tech news',
          slug: 'technology',
        },
        {
          locale: 'ar',
          name: 'تكنولوجيا',
          description: 'أحدث أخبار التكنولوجيا',
          slug: 'technology-ar',
          dir: 'rtl',
        }
      ]
    },
    {
      slug: 'business',
      translations: [
        {
          locale: 'en',
          name: 'Business',
          description: 'Business and financial news',
          slug: 'business',
        },
        {
          locale: 'ar',
          name: 'أعمال',
          description: 'أخبار الأعمال والمال',
          slug: 'business-ar',
          dir: 'rtl',
        }
      ]
    },
    {
      slug: 'culture',
      translations: [
        {
          locale: 'en',
          name: 'Culture',
          description: 'Arts and cultural coverage',
          slug: 'culture',
        },
        {
          locale: 'ar',
          name: 'ثقافة',
          description: 'تغطية الفنون والثقافة',
          slug: 'culture-ar',
          dir: 'rtl',
        }
      ]
    },
  ];
  
  const createdCategories = [];
  
  for (const category of categories) {
    // First upsert the category
    const createdCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
      },
      include: {
        translations: true,
      },
    });
    
    // Then handle translations separately
    for (const translation of category.translations) {
      // Type assertion to avoid TypeScript errors
      const trans = translation as any;
      
      await prisma.categoryTranslation.upsert({
        where: { 
          slug: trans.slug,
        },
        update: {
          name: trans.name,
          description: trans.description,
          dir: trans.dir,
        },
        create: {
          categoryId: createdCategory.id,
          locale: trans.locale,
          name: trans.name,
          description: trans.description,
          slug: trans.slug,
          dir: trans.dir || 'ltr',
        },
      });
    }
    
    // Reload the category with its translations
    const updatedCategory = await prisma.category.findUnique({
      where: { id: createdCategory.id },
      include: { translations: true },
    });
    
    if (updatedCategory) {
      createdCategories.push(updatedCategory);
    }
  }
  
  // Create tags
  console.log('Creating tags...');
  const tags = [
    { name: 'Elections', nameArabic: 'انتخابات' },
    { name: 'Economy', nameArabic: 'اقتصاد' },
    { name: 'AI', nameArabic: 'ذكاء اصطناعي' },
    { name: 'Climate', nameArabic: 'مناخ' },
    { name: 'International', nameArabic: 'دولي' },
    { name: 'Local', nameArabic: 'محلي' },
    { name: 'Health', nameArabic: 'صحة' },
    { name: 'Opinion', nameArabic: 'رأي' },
  ];
  
  const createdTags = [];
  
  for (const tag of tags) {
    const createdTag = await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
    
    createdTags.push(createdTag);
  }
  
  // Create posts
  console.log('Creating posts...');
  const posts = [
    {
      authorId: editorInChief.id,
      categoryId: createdCategories.find(c => c.slug === 'politics')?.id || '',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedById: editorInChief.id,
      featured: true,
      readingTime: 8,
      tags: ['Elections', 'International'],
      translations: [
        {
          locale: 'en',
          title: 'Presidential Election Results Analysis',
          content: `<p>The results of the recent presidential election revealed significant shifts in voter preferences across key demographics. Early analysis suggests that economic concerns played a major role in determining the outcome.</p>
                   <p>Political analysts point to several factors that contributed to the results:</p>
                   <ul>
                    <li>Increased turnout in suburban districts</li>
                    <li>Shifting voter priorities following recent economic developments</li>
                    <li>The impact of new policy proposals announced in the final weeks of the campaign</li>
                   </ul>
                   <p>Exit polls indicate that voters under 35 participated at historically high rates, potentially reshaping the electoral landscape for future contests.</p>`,
          summary: 'Analysis of the recent presidential election results and their implications',
          slug: 'presidential-election-results-analysis',
        },
        {
          locale: 'ar',
          title: 'تحليل نتائج الانتخابات الرئاسية',
          content: `<p>كشفت نتائج الانتخابات الرئاسية الأخيرة عن تحولات كبيرة في تفضيلات الناخبين عبر الفئات الديموغرافية الرئيسية. ويشير التحليل المبكر إلى أن المخاوف الاقتصادية لعبت دورًا رئيسيًا في تحديد النتيجة.</p>
                   <p>يشير المحللون السياسيون إلى عدة عوامل ساهمت في النتائج:</p>
                   <ul>
                    <li>زيادة الإقبال في المناطق الضواحي</li>
                    <li>تحول أولويات الناخبين بعد التطورات الاقتصادية الأخيرة</li>
                    <li>تأثير مقترحات السياسات الجديدة المعلنة في الأسابيع الأخيرة من الحملة</li>
                   </ul>
                   <p>تشير استطلاعات الخروج إلى أن الناخبين دون سن 35 شاركوا بمعدلات مرتفعة تاريخيًا، مما قد يعيد تشكيل المشهد الانتخابي للمنافسات المستقبلية.</p>`,
          summary: 'تحليل لنتائج الانتخابات الرئاسية الأخيرة وآثارها',
          slug: 'presidential-election-results-analysis-ar',
          dir: 'rtl',
        },
      ],
    },
    {
      authorId: seniorEditor.id,
      categoryId: createdCategories.find(c => c.slug === 'technology')?.id || '',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedById: editorInChief.id,
      approvedById: editorInChief.id,
      featured: true,
      readingTime: 5,
      tags: ['AI', 'Economy'],
      translations: [
        {
          locale: 'en',
          title: 'AI Advances Transforming Healthcare Industry',
          content: `<p>Artificial intelligence is revolutionizing healthcare through improved diagnostics, predictive analytics, and personalized treatment plans. Recent breakthroughs in machine learning algorithms have led to unprecedented accuracy in early disease detection.</p>
                   <p>Major healthcare providers are investing heavily in AI infrastructure:</p>
                   <ul>
                    <li>Implementation of AI-assisted diagnostic tools</li>
                    <li>Development of predictive models for patient outcomes</li>
                    <li>Creation of virtual nursing assistants to improve patient experience</li>
                   </ul>
                   <p>Experts predict that within five years, AI systems will become standard components of healthcare delivery in major medical facilities worldwide.</p>`,
          summary: 'How artificial intelligence advancements are transforming healthcare delivery and outcomes',
          slug: 'ai-advances-healthcare-industry',
        },
        {
          locale: 'ar',
          title: 'تقدم الذكاء الاصطناعي يحول صناعة الرعاية الصحية',
          content: `<p>يُحدث الذكاء الاصطناعي ثورة في الرعاية الصحية من خلال تحسين التشخيص والتحليلات التنبؤية وخطط العلاج الشخصية. أدت الاختراقات الأخيرة في خوارزميات التعلم الآلي إلى دقة غير مسبوقة في الكشف المبكر عن الأمراض.</p>
                   <p>تستثمر شركات الرعاية الصحية الكبرى بكثافة في بنية الذكاء الاصطناعي:</p>
                   <ul>
                    <li>تنفيذ أدوات التشخيص بمساعدة الذكاء الاصطناعي</li>
                    <li>تطوير نماذج تنبؤية لنتائج المرضى</li>
                    <li>إنشاء مساعدين افتراضيين للتمريض لتحسين تجربة المريض</li>
                   </ul>
                   <p>يتوقع الخبراء أنه في غضون خمس سنوات، ستصبح أنظمة الذكاء الاصطناعي مكونات قياسية لتقديم الرعاية الصحية في المرافق الطبية الرئيسية في جميع أنحاء العالم.</p>`,
          summary: 'كيف تعمل تطورات الذكاء الاصطناعي على تحويل تقديم الرعاية الصحية ونتائجها',
          slug: 'ai-advances-healthcare-industry-ar',
          dir: 'rtl',
        },
      ],
    },
    {
      authorId: editor.id,
      categoryId: createdCategories.find(c => c.slug === 'business')?.id || '',
      status: PostStatus.WAITING_APPROVAL,
      editorId: editor.id,
      readingTime: 6,
      tags: ['Economy', 'International'],
      translations: [
        {
          locale: 'en',
          title: 'Global Supply Chain Challenges Continue',
          content: `<p>Global supply chains continue to face unprecedented challenges as businesses navigate the aftermath of pandemic disruptions. Manufacturing delays, shipping container shortages, and rising freight costs are impacting industries worldwide.</p>
                   <p>Key challenges include:</p>
                   <ul>
                    <li>Port congestion at major shipping hubs</li>
                    <li>Labor shortages across logistics sectors</li>
                    <li>Increasing costs of raw materials</li>
                   </ul>
                   <p>Companies are implementing various strategies to mitigate these issues, including nearshoring operations, diversifying supplier networks, and investing in inventory management technologies.</p>`,
          summary: 'An overview of ongoing supply chain challenges affecting global businesses',
          slug: 'global-supply-chain-challenges',
        },
        {
          locale: 'ar',
          title: 'استمرار تحديات سلسلة التوريد العالمية',
          content: `<p>تستمر سلاسل التوريد العالمية في مواجهة تحديات غير مسبوقة مع تنقل الشركات في أعقاب اضطرابات الوباء. تؤثر تأخيرات التصنيع ونقص حاويات الشحن وارتفاع تكاليف الشحن على الصناعات في جميع أنحاء العالم.</p>
                   <p>تشمل التحديات الرئيسية:</p>
                   <ul>
                    <li>ازدحام الموانئ في مراكز الشحن الرئيسية</li>
                    <li>نقص العمالة عبر قطاعات اللوجستيات</li>
                    <li>زيادة تكاليف المواد الخام</li>
                   </ul>
                   <p>تقوم الشركات بتنفيذ استراتيجيات مختلفة للتخفيف من هذه المشكلات، بما في ذلك عمليات التقريب، وتنويع شبكات الموردين، والاستثمار في تقنيات إدارة المخزون.</p>`,
          summary: 'نظرة عامة على تحديات سلسلة التوريد المستمرة التي تؤثر على الشركات العالمية',
          slug: 'global-supply-chain-challenges-ar',
          dir: 'rtl',
        },
      ],
    },
    {
      authorId: editor.id,
      categoryId: createdCategories.find(c => c.slug === 'culture')?.id || '',
      status: PostStatus.DRAFT,
      readingTime: 4,
      tags: ['Local', 'Opinion'],
      translations: [
        {
          locale: 'en',
          title: 'Film Festival Highlights Local Talent',
          content: `<p>The annual film festival concluded this weekend, showcasing an impressive array of local filmmaking talent. This year's event featured over 50 films from emerging directors.</p>
                   <p>Festival highlights included:</p>
                   <ul>
                    <li>Award-winning documentary on urban transformation</li>
                    <li>Panel discussions with industry professionals</li>
                    <li>Special screening of restored classic films</li>
                   </ul>
                   <p>Attendance records were broken this year, with organizers reporting a 30% increase in ticket sales compared to previous festivals.</p>`,
          summary: 'Coverage of the annual film festival showcasing local filmmaking talent',
          slug: 'film-festival-local-talent',
        },
      ],
    },
  ];
  
  // Create posts and their translations
  for (const post of posts) {
    const { tags: tagNames, translations, ...postData } = post;
    
    // Create the post
    const createdPost = await prisma.post.create({
      data: {
        ...postData,
        // Connect tags if specified
        tags: tagNames ? {
          create: tagNames.map(tagName => ({
            tag: {
              connect: { name: tagName }
            }
          }))
        } : undefined,
      },
    });
    
    // Create post translations
    for (const translation of translations) {
      // Type assertion to avoid TypeScript errors
      const trans = translation as any;
      
      await prisma.postTranslation.upsert({
        where: { 
          slug: trans.slug,
        },
        update: {
          title: trans.title,
          content: trans.content,
          summary: trans.summary,
        },
        create: {
          postId: createdPost.id,
          locale: trans.locale,
          title: trans.title,
          content: trans.content,
          summary: trans.summary,
          slug: trans.slug,
          dir: trans.dir || 'ltr',
        },
      });
    }
    
    // Create a revision history entry for each post
    if (translations.length > 0) {
      const enTranslation = translations.find(t => t.locale === 'en');
      const arTranslation = translations.find(t => t.locale === 'ar');
      
      if (enTranslation) {
        await prisma.postRevision.create({
          data: {
            postId: createdPost.id,
            title: enTranslation.title,
            titleArabic: arTranslation?.title,
            content: enTranslation.content,
            contentArabic: arTranslation?.content,
            excerpt: enTranslation.summary,
            excerptArabic: arTranslation?.summary,
            status: post.status,
            changedById: post.authorId,
            changeNote: 'Initial version',
          },
        });
      }
    }
    
    // Add some sample media to the first post
    if (posts.indexOf(post) === 0) {
      await prisma.media.create({
        data: {
          url: 'https://static-cse.canva.com/blob/1156552/tools-feature_transparent-image_promo-showcase_02.e6f527fd.jpg',
          type: MediaType.IMAGE,
          title: 'Election Results Chart',
          altText: 'Bar chart showing election results by district',
          caption: 'Voting results across key districts',
          mimeType: 'image/jpeg',
          size: 1245000, // Size in bytes
          postId: createdPost.id,
        },
      });
    }
    
    // Add a comment to the first published post
    if (post.status === 'PUBLISHED' && posts.indexOf(post) === 0) {
      await prisma.comment.create({
        data: {
          content: 'Great analysis of the election results!',
          postId: createdPost.id,
          authorId: editor.id,
        },
      });
    }
  }
  
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