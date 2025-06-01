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
      nameEn: 'Ahmed Al-Mansouri',
      nameAr: 'أحمد المنصوري',
      country: 'UAE',
      bio: 'Chief editor and system administrator with over 10 years of experience in digital journalism',
      bioAr: 'رئيس التحرير ومدير النظام مع أكثر من 10 سنوات من الخبرة في الصحافة الرقمية',
      email: adminEmail,
      isActive: true,
    },
    {
      id: 'content-editor-author',
      nameEn: 'Fatima Al-Zahra',
      nameAr: 'فاطمة الزهراء',
      country: 'Jordan',
      bio: 'Experienced content editor specializing in Middle Eastern affairs and technology',
      bioAr: 'محررة محتوى ذات خبرة متخصصة في الشؤون الشرق أوسطية والتكنولوجيا',
      email: 'editor@phoenix.com',
      isActive: true,
    },
    {
      id: 'default-author',
      nameEn: 'Phoenix Staff',
      nameAr: 'طاقم فينيكس',
      country: 'Lebanon',
      bio: 'The editorial team at Phoenix News',
      bioAr: 'الفريق التحريري في أخبار فينيكس',
      isActive: true,
    },
    {
      id: 'guest-author',
      nameEn: 'Dr. Khalid Hassan',
      nameAr: 'د. خالد حسن',
      country: 'Egypt',
      bio: 'Political analyst and professor of international relations',
      bioAr: 'محلل سياسي وأستاذ العلاقات الدولية',
      isActive: true,
    },
  ];

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
      slug: 'politics',
      order: 1,
      translations: [
        { locale: 'en', name: 'Politics', description: 'Political news and analysis', slug: 'politics' },
        { locale: 'ar', name: 'سياسة', description: 'الأخبار والتحليلات السياسية', slug: 'politics-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'technology',
      order: 2,
      translations: [
        { locale: 'en', name: 'Technology', description: 'Latest technology news and innovations', slug: 'technology' },
        { locale: 'ar', name: 'تكنولوجيا', description: 'أحدث أخبار التكنولوجيا والابتكارات', slug: 'technology-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'business',
      order: 3,
      translations: [
        { locale: 'en', name: 'Business', description: 'Business and economic news', slug: 'business' },
        { locale: 'ar', name: 'أعمال', description: 'أخبار الأعمال والاقتصاد', slug: 'business-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'sports',
      order: 4,
      translations: [
        { locale: 'en', name: 'Sports', description: 'Sports news and updates', slug: 'sports' },
        { locale: 'ar', name: 'رياضة', description: 'الأخبار الرياضية والتحديثات', slug: 'sports-ar', dir: 'rtl' },
      ],
    },
    {
      slug: 'culture',
      order: 5,
      translations: [
        { locale: 'en', name: 'Culture', description: 'Cultural news and events', slug: 'culture' },
        { locale: 'ar', name: 'ثقافة', description: 'الأخبار الثقافية والفعاليات', slug: 'culture-ar', dir: 'rtl' },
      ],
    },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const { translations, ...categoryData } = category;
    
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
  }

  // Create comprehensive sample posts with rich content
  const posts = [
    {
      authorId: superAdmin.id,
      postAuthorId: 'super-admin-author',
      categoryId: createdCategories.find(c => c.slug === 'politics')?.id || '',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-01-15'),
      publishedById: superAdmin.id,
      featured: true,
      readingTime: 8,
      tags: ['Politics', 'International', 'Analysis'],
      translations: [
        {
          locale: 'en',
          title: 'Middle East Summit Addresses Regional Security Challenges',
          content: `<div class="article-content">
            <p class="lead">Leaders from across the Middle East gathered in Dubai this week for a groundbreaking summit focused on addressing the region's most pressing security challenges and fostering diplomatic cooperation.</p>
            
            <h3>Key Outcomes</h3>
            <p>The three-day summit, attended by representatives from 15 countries, resulted in several significant agreements aimed at enhancing regional stability. The participants emphasized the importance of multilateral dialogue in resolving conflicts and promoting economic cooperation.</p>
            
            <blockquote class="blockquote">
              <p>"This summit marks a new chapter in regional diplomacy, where dialogue takes precedence over discord," said the UAE's Foreign Minister during the closing ceremony.</p>
            </blockquote>
            
            <h3>Economic Cooperation Framework</h3>
            <p>One of the most significant outcomes was the establishment of a new economic cooperation framework that will facilitate trade and investment across borders. The framework includes provisions for:</p>
            <ul>
              <li>Streamlined customs procedures</li>
              <li>Joint infrastructure projects</li>
              <li>Technology sharing initiatives</li>
              <li>Educational exchange programs</li>
            </ul>
            
            <h3>Security Partnerships</h3>
            <p>The summit also addressed cybersecurity threats and the need for coordinated responses to regional security challenges. A new joint task force will be established to monitor and respond to emerging threats.</p>
            
            <p>The next summit is scheduled to take place in Jordan in six months, continuing the momentum of diplomatic engagement in the region.</p>
          </div>`,
          summary: 'Middle East leaders convene in Dubai to address regional security and establish new cooperation frameworks',
          slug: 'middle-east-summit-regional-security',
        },
        {
          locale: 'ar',
          title: 'قمة الشرق الأوسط تتناول تحديات الأمن الإقليمي',
          content: `<div class="article-content" dir="rtl">
            <p class="lead">اجتمع قادة من جميع أنحاء الشرق الأوسط في دبي هذا الأسبوع في قمة رائدة تهدف إلى معالجة أكثر التحديات الأمنية إلحاحاً في المنطقة وتعزيز التعاون الدبلوماسي.</p>
            
            <h3>النتائج الرئيسية</h3>
            <p>أسفرت القمة التي استمرت ثلاثة أيام وحضرها ممثلون من 15 دولة عن عدة اتفاقيات مهمة تهدف إلى تعزيز الاستقرار الإقليمي. أكد المشاركون على أهمية الحوار متعدد الأطراف في حل النزاعات وتعزيز التعاون الاقتصادي.</p>
            
            <blockquote class="blockquote">
              <p>"تمثل هذه القمة فصلاً جديداً في الدبلوماسية الإقليمية، حيث يأخذ الحوار الأسبقية على الخلاف"، قال وزير خارجية الإمارات خلال حفل الختام.</p>
            </blockquote>
            
            <h3>إطار التعاون الاقتصادي</h3>
            <p>كانت إحدى أهم النتائج هي إنشاء إطار جديد للتعاون الاقتصادي سيسهل التجارة والاستثمار عبر الحدود. يشمل الإطار أحكاماً لـ:</p>
            <ul>
              <li>إجراءات جمركية مبسطة</li>
              <li>مشاريع البنية التحتية المشتركة</li>
              <li>مبادرات تبادل التكنولوجيا</li>
              <li>برامج التبادل التعليمي</li>
            </ul>
            
            <h3>الشراكات الأمنية</h3>
            <p>تناولت القمة أيضاً التهديدات السيبرانية والحاجة إلى استجابات منسقة للتحديات الأمنية الإقليمية. سيتم إنشاء فريق عمل مشترك جديد لمراقبة والاستجابة للتهديدات الناشئة.</p>
            
            <p>من المقرر أن تعقد القمة القادمة في الأردن خلال ستة أشهر، مما يواصل زخم المشاركة الدبلوماسية في المنطقة.</p>
          </div>`,
          summary: 'قادة الشرق الأوسط يجتمعون في دبي لمعالجة الأمن الإقليمي وإنشاء أطر تعاون جديدة',
          slug: 'middle-east-summit-regional-security-ar',
          dir: 'rtl',
        },
      ],
    },
    {
      authorId: editor.id,
      postAuthorId: 'content-editor-author',
      categoryId: createdCategories.find(c => c.slug === 'technology')?.id || '',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-01-14'),
      publishedById: superAdmin.id,
      approvedById: superAdmin.id,
      editorId: editor.id,
      featured: true,
      readingTime: 6,
      tags: ['Technology', 'Business', 'Innovation'],
      translations: [
        {
          locale: 'en',
          title: 'Artificial Intelligence Revolutionizes Healthcare in the Gulf Region',
          content: `<div class="article-content">
            <p class="lead">Healthcare systems across the Gulf Cooperation Council (GCC) countries are experiencing a transformative shift as artificial intelligence technologies become increasingly integrated into medical practices and patient care.</p>
            
            <h3>AI-Powered Diagnostics</h3>
            <p>Major hospitals in the UAE, Saudi Arabia, and Qatar have begun implementing AI-powered diagnostic tools that can detect diseases with unprecedented accuracy. These systems are particularly effective in:</p>
            <ul>
              <li>Early cancer detection through medical imaging</li>
              <li>Cardiovascular disease risk assessment</li>
              <li>Neurological disorder diagnosis</li>
              <li>Infectious disease monitoring</li>
            </ul>
            
            <h3>Telemedicine Expansion</h3>
            <p>The COVID-19 pandemic accelerated the adoption of telemedicine across the region, and AI is now enhancing these remote healthcare services. Intelligent chatbots and virtual assistants are providing initial patient assessments, while machine learning algorithms help healthcare providers prioritize urgent cases.</p>
            
            <blockquote class="blockquote">
              <p>"AI is not replacing doctors; it's empowering them to make better decisions and provide more personalized care," explains Dr. Sarah Al-Rashid, Chief Technology Officer at Dubai Health Authority.</p>
            </blockquote>
            
            <h3>Personalized Treatment Plans</h3>
            <p>AI algorithms are analyzing vast amounts of patient data to create personalized treatment plans that consider individual genetic profiles, lifestyle factors, and medical history. This approach has shown remarkable success in chronic disease management and preventive care.</p>
            
            <h3>Investment and Innovation</h3>
            <p>The region has seen significant investment in health-tech startups, with over $500 million invested in AI healthcare solutions in 2023 alone. Government initiatives are supporting research and development in this sector, positioning the Gulf as a global hub for medical innovation.</p>
          </div>`,
          summary: 'AI technologies are transforming healthcare delivery across GCC countries with advanced diagnostics and personalized treatment',
          slug: 'ai-revolutionizes-healthcare-gulf-region',
        },
        {
          locale: 'ar',
          title: 'الذكاء الاصطناعي يحدث ثورة في الرعاية الصحية بمنطقة الخليج',
          content: `<div class="article-content" dir="rtl">
            <p class="lead">تشهد أنظمة الرعاية الصحية في جميع أنحاء دول مجلس التعاون الخليجي تحولاً جذرياً حيث تصبح تقنيات الذكاء الاصطناعي متكاملة بشكل متزايد في الممارسات الطبية ورعاية المرضى.</p>
            
            <h3>التشخيص المدعوم بالذكاء الاصطناعي</h3>
            <p>بدأت المستشفيات الرئيسية في الإمارات والسعودية وقطر في تطبيق أدوات التشخيص المدعومة بالذكاء الاصطناعي التي يمكنها اكتشاف الأمراض بدقة غير مسبوقة. هذه الأنظمة فعالة بشكل خاص في:</p>
            <ul>
              <li>الكشف المبكر عن السرطان من خلال التصوير الطبي</li>
              <li>تقييم مخاطر أمراض القلب والأوعية الدموية</li>
              <li>تشخيص الاضطرابات العصبية</li>
              <li>مراقبة الأمراض المعدية</li>
            </ul>
            
            <h3>توسع الطب عن بُعد</h3>
            <p>أدت جائحة كوفيد-19 إلى تسريع اعتماد الطب عن بُعد في جميع أنحاء المنطقة، والآن يعزز الذكاء الاصطناعي هذه الخدمات الصحية عن بُعد. توفر الروبوتات الذكية والمساعدين الافتراضيين تقييمات أولية للمرضى، بينما تساعد خوارزميات التعلم الآلي مقدمي الرعاية الصحية في تحديد أولوية الحالات العاجلة.</p>
            
            <blockquote class="blockquote">
              <p>"الذكاء الاصطناعي لا يحل محل الأطباء؛ بل يمكّنهم من اتخاذ قرارات أفضل وتقديم رعاية أكثر تخصصاً"، تشرح د. سارة الراشد، كبير مسؤولي التكنولوجيا في هيئة الصحة بدبي.</p>
            </blockquote>
            
            <h3>خطط العلاج الشخصية</h3>
            <p>تحلل خوارزميات الذكاء الاصطناعي كميات هائلة من بيانات المرضى لإنشاء خطط علاج شخصية تأخذ في الاعتبار الملفات الجينية الفردية وعوامل نمط الحياة والتاريخ الطبي. هذا النهج أظهر نجاحاً ملحوظاً في إدارة الأمراض المزمنة والرعاية الوقائية.</p>
            
            <h3>الاستثمار والابتكار</h3>
            <p>شهدت المنطقة استثماراً كبيراً في الشركات الناشئة في مجال التكنولوجيا الصحية، مع أكثر من 500 مليون دولار تم استثمارها في حلول الذكاء الاصطناعي للرعاية الصحية في عام 2023 وحده. تدعم المبادرات الحكومية البحث والتطوير في هذا القطاع، مما يضع الخليج كمركز عالمي للابتكار الطبي.</p>
          </div>`,
          summary: 'تقنيات الذكاء الاصطناعي تحول تقديم الرعاية الصحية في دول مجلس التعاون الخليجي مع التشخيص المتقدم والعلاج الشخصي',
          slug: 'ai-revolutionizes-healthcare-gulf-region-ar',
          dir: 'rtl',
        },
      ],
    },
    {
      authorId: superAdmin.id,
      postAuthorId: 'guest-author',
      categoryId: createdCategories.find(c => c.slug === 'business')?.id || '',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-01-13'),
      publishedById: superAdmin.id,
      featured: false,
      readingTime: 5,
      tags: ['Business', 'Economy', 'International'],
      translations: [
        {
          locale: 'en',
          title: 'Green Energy Investments Surge in MENA Region',
          content: `<div class="article-content">
            <p class="lead">The Middle East and North Africa (MENA) region is witnessing unprecedented growth in green energy investments, with renewable energy projects attracting billions in funding as countries work toward carbon neutrality goals.</p>
            
            <h3>Investment Milestones</h3>
            <p>According to the latest report from the International Renewable Energy Agency (IRENA), MENA countries invested over $15 billion in renewable energy projects in 2023, representing a 35% increase from the previous year.</p>
            
            <h3>Solar Power Leadership</h3>
            <p>The UAE continues to lead the region in solar energy development, with the Mohammed bin Rashid Al Maktoum Solar Park now generating over 1,000 MW of clean energy. Similar large-scale projects are underway in Saudi Arabia, Egypt, and Morocco.</p>
            
            <h3>Economic Benefits</h3>
            <p>These investments are creating thousands of jobs and positioning the region as a global leader in renewable energy technology. The sector is expected to contribute significantly to economic diversification efforts across oil-dependent economies.</p>
          </div>`,
          summary: 'MENA region sees massive increase in renewable energy investments as countries pursue sustainability goals',
          slug: 'green-energy-investments-surge-mena',
        },
      ],
    },
  ];

  // Create posts
  for (const post of posts) {
    const { tags: tagNames, translations, ...postData } = post;
    
    const createdPost = await prisma.post.create({
      data: {
        ...postData,
        tags: tagNames ? {
          create: tagNames.map(tagName => ({
            tag: { connect: { name: tagName } }
          }))
        } : undefined,
      },
    });

    // Create post translations
    for (const translation of translations) {
      await prisma.postTranslation.upsert({
        where: { slug: translation.slug },
        update: {},
        create: {
          postId: createdPost.id,
          locale: translation.locale,
          title: translation.title,
          content: translation.content,
          summary: translation.summary,
          slug: translation.slug,
          dir: (translation as any).dir || 'ltr',
        },
      });
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