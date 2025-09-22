import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';
import Link from 'next/link';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Cookies Policy | Ektisadi.com',
  description: 'Learn how Ektisadi.com uses cookies and similar technologies on our website.',
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
      lastUpdated: 'Last Updated: September 22, 2025',
      introduction: 'This Cookies Policy explains how Ektisadi.com uses cookies ("Cookies") and similar tracking technologies on our website. We recommend reading this policy carefully to understand the type of data we collect, how we use it, and the options available to you for managing cookies.',
      sections: [
        {
          heading: '1. What are Cookies?',
          text: 'Cookies are small text files that are stored on your computer or mobile device when you visit websites. They are widely used to enhance website efficiency and improve user experience.\n\nPersistent Cookies: Remain on your device even after closing the browser and are used to remember user settings and preferences.\n\nSession Cookies: Are automatically deleted when the browser is closed.'
        },
        {
          heading: '2. Our Use of Cookies',
          text: 'We use cookies for the following purposes:\n\n1. Enabling technical operation of the website and its essential functions ("Essential" cookies).\n2. Analyzing performance and improving user experience.\n3. Customizing content and advertisements to match user interests.\n4. Facilitating third-party services such as advertising and analytics.'
        },
        {
          heading: '3. Types of Cookies Used',
          subsections: [
            {
              title: 'A. Essential Cookies',
              description: 'Essential for website operation and cannot be disabled in our systems. Include login, privacy preferences, and form usage.'
            },
            {
              title: 'B. Performance Cookies',
              description: 'Allow measuring visit counts and sources and analyzing page usage to improve website performance.'
            },
            {
              title: 'C. Functional Cookies',
              description: 'Enable the website to provide enhanced functionality and personalized experience, and may be set by us or third-party service providers.'
            },
            {
              title: 'D. Targeting and Advertising Cookies',
              description: 'May be set through our advertising partners to build interest profiles and display relevant advertisements to you on other sites.'
            }
          ]
        },
        {
          heading: '4. Third-Party Cookies',
          text: 'The website may use third-party cookies for analysis, advertising, and reporting website usage. It is emphasized that any third party is subject to their own privacy policies.'
        },
        {
          heading: '5. Controlling and Deleting Cookies',
          text: 'Most internet browsers allow control of cookies, including rejecting all of them or modifying their settings. Please note that disabling some cookies may affect website usage experience and functionality, including saving your custom settings and automatic login.'
        },
        {
          heading: '6. Updates to Cookies Policy',
          text: 'Ektisadi.com administration reserves the right to modify this policy at any time, provided that the new version is published on the website with updating the "Last Updated" date. Continued use of the website after modifications is considered explicit consent thereto.'
        },
        {
          heading: '7. Contact Us',
          text: 'For any inquiries or requests related to the cookies policy, please contact us via email: contact@ektisadi.com'
        }
      ]
    },
    ar: {
      title: 'سياسة ملفات تعريف الارتباط',
      lastUpdated: 'آخر تحديث: 22 أيلول / سبتمبر 2025',
      introduction: 'توضح سياسة ملفات تعريف الارتباط هذه كيفية استخدام اقتصادي.كوم لملفات تعريف الارتباط ("Cookies") وتقنيات التتبع المماثلة على موقعنا الإلكتروني. نوصي بقراءة هذه السياسة بعناية لفهم نوع البيانات التي نجمعها، كيفية استخدامها، والخيارات المتاحة لك بشأن إدارة ملفات تعريف الارتباط.',
      sections: [
        {
          heading: '1. ما هي ملفات تعريف الارتباط؟',
          text: 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهاز الكمبيوتر أو الجهاز المحمول الخاص بك عند زيارة مواقع الإنترنت. تُستخدم على نطاق واسع لتعزيز كفاءة الموقع وتحسين تجربة المستخدم.\n\nملفات تعريف الارتباط الدائمة: تبقى على جهازك حتى بعد إغلاق المتصفح، وتُستخدم لتذكر إعدادات وتفضيلات المستخدم.\n\nملفات تعريف الارتباط الخاصة بالجلسة: تُحذف تلقائيًا عند إغلاق المتصفح.'
        },
        {
          heading: '2. استخدامنا لملفات تعريف الارتباط',
          text: 'نستخدم ملفات تعريف الارتباط للأغراض التالية:\n\n1. تمكين التشغيل التقني للموقع ووظائفه الأساسية (ملفات تعريف الارتباط "الضرورية").\n2. تحليل الأداء وتحسين تجربة المستخدم.\n3. تخصيص المحتوى والإعلانات بما يتوافق مع اهتمامات المستخدمين.\n4. تسهيل خدمات الطرف الثالث مثل الإعلانات والتحليلات.'
        },
        {
          heading: '3. أنواع ملفات تعريف الارتباط المستخدمة',
          subsections: [
            {
              title: 'أ. ملفات تعريف الارتباط الضرورية',
              description: 'أساسية لتشغيل الموقع ولا يمكن تعطيلها في أنظمتنا. تشمل تسجيل الدخول، تفضيلات الخصوصية، واستخدام النماذج.'
            },
            {
              title: 'ب. ملفات تعريف الارتباط الخاصة بالأداء',
              description: 'تتيح قياس عدد الزيارات ومصادرها وتحليل استخدام الصفحات لتحسين أداء الموقع.'
            },
            {
              title: 'ج. ملفات تعريف الارتباط الوظيفية',
              description: 'تمكّن الموقع من تقديم وظائف محسّنة وتجربة شخصية، وقد يتم تعيينها من قبلنا أو من مزودي خدمات الطرف الثالث.'
            },
            {
              title: 'د. ملفات تعريف الارتباط للاستهداف والإعلانات',
              description: 'قد يتم تعيينها عبر شركائنا في الإعلان لبناء ملفات تعريف الاهتمامات وعرض إعلانات ملائمة لك على مواقع أخرى.'
            }
          ]
        },
        {
          heading: '4. ملفات تعريف الارتباط من طرف ثالث',
          text: 'قد يستخدم الموقع ملفات تعريف الارتباط من أطراف ثالثة لأغراض التحليل والإعلان والإبلاغ عن استخدام الموقع. يُشدد على أن أي طرف ثالث يخضع لسياسات الخصوصية الخاصة به.'
        },
        {
          heading: '5. التحكم في ملفات تعريف الارتباط وحذفها',
          text: 'تتيح معظم متصفحات الإنترنت التحكم في ملفات تعريف الارتباط، بما في ذلك رفض جميعها أو تعديل إعداداتها. يُرجى الانتباه إلى أن تعطيل بعض ملفات تعريف الارتباط قد يؤثر على تجربة استخدام الموقع ووظائفه، بما في ذلك حفظ إعداداتك المخصصة وتسجيل الدخول التلقائي.'
        },
        {
          heading: '6. التحديثات على سياسة ملفات تعريف الارتباط',
          text: 'تحتفظ إدارة اقتصادي.كوم بحق تعديل هذه السياسة في أي وقت، على أن تُنشر النسخة الجديدة على الموقع مع تحديث تاريخ "آخر تحديث". ويعتبر استمرار استخدام الموقع بعد التعديلات بمثابة موافقة صريحة عليها.'
        },
        {
          heading: '7. الاتصال بنا',
          text: 'لأي استفسارات أو طلبات تتعلق بسياسة ملفات تعريف الارتباط، يُرجى التواصل معنا عبر البريد الإلكتروني: contact@ektisadi.com'
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