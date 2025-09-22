import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';
import Link from 'next/link';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Privacy Policy | Ektisadi.com',
  description: 'Learn how Ektisadi.com handles your personal data and respects your privacy.',
};

export default async function PrivacyPage() {
  // Get current locale from cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isRTL = locale === 'ar';

  // Content for English and Arabic
  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: September 22, 2025',
      sections: [
        {
          heading: '1. Introduction',
          text: 'Ektisadi.com ("we", "the Website") is committed to protecting the privacy of its users and ensuring the confidentiality of their personal data in accordance with the provisions in force in the Lebanese Republic, particularly Law No. 81/2018 on Electronic Transactions and Personal Data. This policy explains how we collect, use, disclose, and protect your data when you visit our website or use our services. Your continued use of the website constitutes explicit consent to the practices outlined in this policy.'
        },
        {
          heading: '2. Data We Collect',
          text: 'We may collect personal data voluntarily provided by users when registering an account, subscribing to newsletters, participating in surveys, or contacting us. This data includes, for example: name, email address, postal address, phone number, and demographic information. We may also automatically collect technical data, including IP address, browser type, operating system, referring website, pages visited, and dates and times of access.'
        },
        {
          heading: '3. How We Use Data',
          text: 'The data we collect is used for the following purposes: 1- Operating and maintaining services provided through the website. 2- Improving, developing, and personalizing services. 3- Analyzing visitor usage and understanding browsing patterns. 4- Developing new features and additional services. 5- Communicating with users for technical support, updates, or promotional campaigns. 6- Completing financial transactions and subscriptions. 7- Preventing fraudulent or illegal activities. 8- Handling technical issues and protecting service security.'
        },
        {
          heading: '4. Data Sharing',
          text: 'We may share your personal data with third parties exclusively in the following cases: 1- Contracted service providers (such as hosting, payment processing, email, customer service), within the limits necessary to perform their tasks. 2- Compliance with legal obligations or execution of orders issued by competent authorities according to Lebanese laws. 3- Protecting the rights of Ektisadi.com or our users or their safety, within the framework permitted by applicable laws.'
        },
        {
          heading: '5. Cookies',
          text: 'The website relies on cookies and similar technologies to enhance user experience and collect data about browsing patterns. Users have the freedom to adjust their browser settings to reject all cookies or alert them when sent, with the understanding that some website features may not work properly if rejected. For more details, please review our Cookies Policy.'
        },
        {
          heading: '6. Data Protection',
          text: 'The website administration implements reasonable administrative, technical, and organizational measures to protect personal data from any unauthorized access, use, modification, or disclosure. However, users acknowledge that no electronic system can be absolutely secure, and the website administration bears no responsibility for security breaches beyond its control.'
        },
        {
          heading: '7. User Rights',
          text: 'According to applicable Lebanese laws, users have certain rights regarding their personal data, including the right to access, correct, modify, or request deletion. To exercise these rights, users can contact us via the email listed below.'
        },
        {
          heading: '8. Privacy Policy Modifications',
          text: 'Ektisadi.com administration reserves the right to modify this policy at any time. Continued use of the service after publishing any modifications constitutes explicit consent thereto. All updates are placed with the "Last Updated" date at the top of this page.'
        },
        {
          heading: '9. Contact Us',
          text: 'For any inquiries or requests related to the privacy policy, please contact us via email: contact@ektisadi.com'
        }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 22 أيلول / سبتمبر 2025',
      sections: [
        {
          heading: '1. المقدمة',
          text: 'تلتزم اقتصادي.كوم ("نحن"، "الموقع") بحماية خصوصية مستخدميها وضمان سرية بياناتهم الشخصية وفقًا للأحكام المرعية في الجمهورية اللبنانية، ولا سيما قانون المعاملات الإلكترونية والبيانات ذات الطابع الشخصي رقم 81/2018. توضّح هذه السياسة كيفية جمع بياناتك واستخدامها والكشف عنها وحمايتها عند زيارتك لموقعنا أو استخدامك لخدماتنا. إن استمرارك في استخدام الموقع يُعدّ موافقة صريحة منك على الممارسات المبينة في هذه السياسة.'
        },
        {
          heading: '2. البيانات التي نجمعها',
          text: 'قد نقوم بجمع بيانات شخصية يقدّمها المستخدم طوعًا عند تسجيل حساب، الاشتراك في النشرات الدورية، المشاركة في الاستطلاعات، أو التواصل معنا. وتشمل هذه البيانات على سبيل المثال: الاسم، عنوان البريد الإلكتروني، العنوان البريدي، رقم الهاتف، والمعلومات الديموغرافية. كما قد نقوم بجمع بيانات تقنية تلقائيًا، منها عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، نظام التشغيل، الموقع الإلكتروني المرجعي، الصفحات التي تمت زيارتها، وتواريخ وأوقات الدخول.'
        },
        {
          heading: '3. كيفية استخدام البيانات',
          text: 'تُستخدم البيانات التي نجمعها للأغراض التالية: 1- تشغيل وصيانة الخدمات المقدّمة عبر الموقع. 2- تحسين الخدمات وتطويرها وإضفاء طابع شخصي عليها. 3- تحليل استخدام الزوار وفهم أنماط التصفح. 4- تطوير ميزات جديدة وخدمات إضافية. 5- التواصل مع المستخدمين لأغراض الدعم الفني أو التحديثات أو الحملات الترويجية. 6- إتمام المعاملات المالية والاشتراكات. 7- منع الأنشطة الاحتيالية أو غير القانونية. 8- معالجة الأعطال التقنية وحماية أمن الخدمة.'
        },
        {
          heading: '4. مشاركة البيانات',
          text: 'قد نشارك بياناتك الشخصية مع أطراف ثالثة حصراً في الحالات التالية: 1- مقدّمي الخدمات المتعاقدين معنا (مثل الاستضافة، معالجة المدفوعات، البريد الإلكتروني، خدمة العملاء)، وذلك ضمن الحدود اللازمة لأداء مهامهم. 2- الامتثال للالتزامات القانونية أو تنفيذ أمر صادر عن السلطات المختصة وفقًا للقوانين اللبنانية. 3- حماية حقوق اقتصادي.كوم أو حقوق مستخدمينا أو سلامتهم، في إطار ما تجيزه القوانين النافذة.'
        },
        {
          heading: '5. ملفات تعريف الارتباط (Cookies)',
          text: 'يعتمد الموقع على ملفات تعريف الارتباط وتقنيات مشابهة لتعزيز تجربة المستخدم وجمع بيانات حول أنماط التصفح. للمستخدم حرية ضبط إعدادات متصفحه لرفض جميع ملفات تعريف الارتباط أو تنبيهه عند إرسالها، مع العلم أن بعض ميزات الموقع قد لا تعمل بشكل صحيح في حال رفضها. لمزيد من التفاصيل، يُرجى مراجعة سياسة ملفات تعريف الارتباط الخاصة بنا.'
        },
        {
          heading: '6. حماية البيانات',
          text: 'تعتمد إدارة الموقع تدابير إدارية وتقنية وتنظيمية معقولة لحماية البيانات الشخصية من أي وصول أو استخدام أو تعديل أو إفشاء غير مصرّح به. ومع ذلك، يقرّ المستخدم بأن أي نظام إلكتروني لا يمكن أن يكون آمنًا بشكل مطلق، ولا تتحمّل إدارة الموقع أي مسؤولية عن خرق أمني خارج عن سيطرتها.'
        },
        {
          heading: '7. حقوق المستخدم',
          text: 'وفقًا للقوانين اللبنانية المرعية، يتمتع المستخدم بحقوق معينة تتعلق ببياناته الشخصية، تشمل الحق في الاطلاع، التصحيح، التعديل، أو طلب الحذف. لممارسة هذه الحقوق، يمكن للمستخدم التواصل معنا عبر البريد الإلكتروني المدرج أدناه.'
        },
        {
          heading: '8. تعديلات سياسة الخصوصية',
          text: 'تحتفظ إدارة اقتصادي.كوم بحقها في تعديل هذه السياسة في أي وقت. ويُعتبر استمرار استخدام الخدمة بعد نشر أي تعديلات بمثابة موافقة صريحة عليها. توضع جميع التحديثات مع تاريخ "آخر تحديث" في أعلى هذه الصفحة.'
        },
        {
          heading: '9. الاتصال بنا',
          text: 'لأي استفسارات أو طلبات تتعلق بسياسة الخصوصية، يُرجى التواصل معنا عبر البريد الإلكتروني: contact@ektisadi.com'
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
          <p className="text-gray-500 mb-8">{pageContent.lastUpdated}</p>

          <div className="prose max-w-none">
            {pageContent.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
                <p className="text-gray-700">{section.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              {isRTL 
                ? 'لمزيد من المعلومات، يرجى الاطلاع على ' 
                : 'For more information, please see our '}
              <Link 
                href="/cookies" 
                className="text-primary-600 hover:underline"
              >
                {isRTL ? 'سياسة ملفات تعريف الارتباط' : 'Cookies Policy'}
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