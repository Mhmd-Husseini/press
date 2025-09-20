import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';
import Link from 'next/link';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Cookies Policy | Phoenix Press',
  description: 'Learn how Phoenix Press uses cookies and similar technologies on our website.',
};

export default async function CookiesPage() {
  // Get current locale from cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isRTL = locale === 'ar';

  // Content for English and Arabic
  const content = {
    en: {
      title: 'Cookies Policy',
      lastUpdated: 'Last Updated: June 1, 2024',
      introduction: 'This Cookies Policy explains what cookies are and how Phoenix Press uses them on our website. We encourage you to read this policy to understand what cookies are, how we use them, and the choices you have regarding their use.',
      sections: [
        {
          heading: '1. What are Cookies?',
          text: 'Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners. Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device when you go offline, while session cookies are deleted as soon as you close your web browser.'
        },
        {
          heading: '2. How We Use Cookies',
          text: 'We use cookies for several reasons. Some cookies are required for technical reasons for our website to operate, and we refer to these as "essential" or "necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our website. Third parties may also serve cookies through our website for advertising, analytics, and other purposes.'
        },
        {
          heading: '3. Types of Cookies We Use',
          subsections: [
            {
              title: 'Essential Cookies',
              description: 'These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.'
            },
            {
              title: 'Performance Cookies',
              description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.'
            },
            {
              title: 'Functional Cookies',
              description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.'
            },
            {
              title: 'Targeting Cookies',
              description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites.'
            }
          ]
        },
        {
          heading: '4. Third-Party Cookies',
          text: 'In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on.'
        },
        {
          heading: '5. How to Control and Delete Cookies',
          text: 'Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.'
        },
        {
          heading: '6. Changes to This Cookies Policy',
          text: 'We may update our Cookies Policy from time to time. We will notify you of any changes by posting the new Cookies Policy on this page and updating the "Last Updated" date.'
        },
        {
          heading: '7. Contact Us',
          text: 'If you have any questions about our Cookies Policy, please contact us at privacy@phoenixpress.com.'
        }
      ]
    },
    ar: {
      title: 'سياسة ملفات تعريف الارتباط',
      lastUpdated: 'آخر تحديث: 1 يونيو 2024',
      introduction: 'توضح سياسة ملفات تعريف الارتباط هذه ماهية ملفات تعريف الارتباط وكيفية استخدام فينيكس بريس لها على موقعنا الإلكتروني. نشجعك على قراءة هذه السياسة لفهم ماهية ملفات تعريف الارتباط، وكيفية استخدامنا لها، والخيارات المتاحة لك بشأن استخدامها.',
      sections: [
        {
          heading: '1. ما هي ملفات تعريف الارتباط؟',
          text: 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهاز الكمبيوتر أو الجهاز المحمول الخاص بك عند زيارة موقع ويب. يتم استخدامها على نطاق واسع لجعل مواقع الويب تعمل بكفاءة أكبر وتوفير المعلومات لأصحاب المواقع. يمكن أن تكون ملفات تعريف الارتباط "دائمة" أو ملفات تعريف ارتباط "جلسة". تبقى ملفات تعريف الارتباط الدائمة على جهازك عندما تكون غير متصل بالإنترنت، بينما يتم حذف ملفات تعريف ارتباط الجلسة بمجرد إغلاق متصفح الويب الخاص بك.'
        },
        {
          heading: '2. كيف نستخدم ملفات تعريف الارتباط',
          text: 'نستخدم ملفات تعريف الارتباط لعدة أسباب. بعض ملفات تعريف الارتباط مطلوبة لأسباب تقنية لتشغيل موقعنا الإلكتروني، ونشير إليها باسم ملفات تعريف الارتباط "الأساسية" أو "الضرورية". تمكننا ملفات تعريف الارتباط الأخرى من تتبع واستهداف اهتمامات مستخدمينا لتعزيز التجربة على موقعنا الإلكتروني. قد تقدم أطراف ثالثة أيضًا ملفات تعريف ارتباط من خلال موقعنا الإلكتروني للإعلان والتحليلات وأغراض أخرى.'
        },
        {
          heading: '3. أنواع ملفات تعريف الارتباط التي نستخدمها',
          subsections: [
            {
              title: 'ملفات تعريف الارتباط الضرورية',
              description: 'هذه الملفات ضرورية لعمل الموقع الإلكتروني ولا يمكن إيقافها في أنظمتنا. عادةً ما يتم تعيينها فقط استجابةً للإجراءات التي تقوم بها والتي تشكل طلبًا للخدمات، مثل تعيين تفضيلات الخصوصية الخاصة بك، أو تسجيل الدخول، أو ملء النماذج.'
            },
            {
              title: 'ملفات تعريف الارتباط للأداء',
              description: 'تسمح لنا ملفات تعريف الارتباط هذه بإحصاء الزيارات ومصادر حركة المرور حتى نتمكن من قياس وتحسين أداء موقعنا. فهي تساعدنا على معرفة الصفحات الأكثر والأقل شعبية ومعرفة كيفية تنقل الزوار في الموقع.'
            },
            {
              title: 'ملفات تعريف الارتباط الوظيفية',
              description: 'تمكن ملفات تعريف الارتباط هذه الموقع الإلكتروني من توفير وظائف وتخصيص محسنة. قد يتم تعيينها من قبلنا أو من قبل مزودي الطرف الثالث الذين أضفنا خدماتهم إلى صفحاتنا.'
            },
            {
              title: 'ملفات تعريف الارتباط للاستهداف',
              description: 'قد يتم تعيين ملفات تعريف الارتباط هذه من خلال موقعنا بواسطة شركائنا في الإعلان. قد تستخدمها تلك الشركات لبناء ملف تعريف لاهتماماتك وإظهار الإعلانات ذات الصلة لك على مواقع أخرى.'
            }
          ]
        },
        {
          heading: '4. ملفات تعريف الارتباط من الطرف الثالث',
          text: 'بالإضافة إلى ملفات تعريف الارتباط الخاصة بنا، قد نستخدم أيضًا ملفات تعريف ارتباط متنوعة من طرف ثالث للإبلاغ عن إحصاءات استخدام الموقع الإلكتروني، وتقديم الإعلانات على الموقع الإلكتروني ومن خلاله، وما إلى ذلك.'
        },
        {
          heading: '5. كيفية التحكم في ملفات تعريف الارتباط وحذفها',
          text: 'تسمح لك معظم متصفحات الويب بالتحكم في ملفات تعريف الارتباط من خلال تفضيلات الإعدادات الخاصة بها. ومع ذلك، إذا قمت بالحد من قدرة مواقع الويب على تعيين ملفات تعريف الارتباط، فقد تؤدي إلى تدهور تجربة المستخدم الإجمالية لديك، حيث لن يتم تخصيصها لك بعد الآن. قد يمنعك أيضًا من حفظ الإعدادات المخصصة مثل معلومات تسجيل الدخول.'
        },
        {
          heading: '6. التغييرات في سياسة ملفات تعريف الارتباط هذه',
          text: 'قد نقوم بتحديث سياسة ملفات تعريف الارتباط الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات من خلال نشر سياسة ملفات تعريف الارتباط الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".'
        },
        {
          heading: '7. اتصل بنا',
          text: 'إذا كانت لديك أي أسئلة حول سياسة ملفات تعريف الارتباط الخاصة بنا، يرجى الاتصال بنا على privacy@phoenixpress.com.'
        }
      ]
    }
  };

  // Get content based on current locale
  const pageContent = locale === 'ar' ? content.ar : content.en;

  return (
    <MainLayout>
      <div className={`container mx-auto py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{pageContent.title}</h1>
          <p className="text-gray-500 mb-4">{pageContent.lastUpdated}</p>
          <p className="text-gray-700 mb-8">{pageContent.introduction}</p>

          <div className="prose max-w-none">
            {pageContent.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
                
                {section.text && <p className="text-gray-700 mb-4">{section.text}</p>}
                
                {section.subsections && (
                  <div className="ml-4 mt-4">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} className="mb-4">
                        <h3 className="text-xl font-medium mb-2">{subsection.title}</h3>
                        <p className="text-gray-700">{subsection.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              {isRTL 
                ? 'لمزيد من المعلومات، يرجى الاطلاع على ' 
                : 'For more information, please see our '}
              <Link 
                href="/privacy" 
                className="text-primary-600 hover:underline"
              >
                {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
              {isRTL ? ' و ' : ' and '}
              <Link 
                href="/terms" 
                className="text-primary-600 hover:underline"
              >
                {isRTL ? 'شروط الخدمة' : 'Terms of Service'}
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 