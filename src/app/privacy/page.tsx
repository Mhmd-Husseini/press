import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';
import Link from 'next/link';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Privacy Policy | Phoenix Press',
  description: 'Learn how Phoenix Press handles your personal data and respects your privacy.',
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
      lastUpdated: 'Last Updated: June 1, 2024',
      sections: [
        {
          heading: '1. Introduction',
          text: 'Phoenix Press ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. Please read this privacy policy carefully. By continuing to use our website and services, you consent to the practices described in this policy.'
        },
        {
          heading: '2. Information We Collect',
          text: 'We may collect personal information that you voluntarily provide to us when you register an account, subscribe to our newsletter, respond to surveys, or contact us. The personal information we collect may include your name, email address, postal address, phone number, and demographic information. We may also automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring website, pages visited, and the dates/times of visits.'
        },
        {
          heading: '3. How We Use Your Information',
          text: 'We may use the information we collect for various purposes, including to: provide, operate, and maintain our services; improve, personalize, and expand our services; understand and analyze how you use our services; develop new products, services, features, and functionality; communicate with you for customer service, updates, and marketing purposes; process transactions; prevent fraudulent transactions; monitor and analyze usage patterns; and detect, prevent, and address technical issues.'
        },
        {
          heading: '4. Disclosure of Your Information',
          text: 'We may share your information with third parties in certain situations. We may share your information with service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting services, and customer service. We may also share your information when required by law or to protect our rights.'
        },
        {
          heading: '5. Cookies and Tracking Technologies',
          text: 'We use cookies and similar tracking technologies to collect information about your browsing activities. Cookies are small files that a site or its service provider transfers to your device which enables the site to recognize your browser and remember certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service. For more information about our use of cookies, please see our Cookies Policy.'
        },
        {
          heading: '6. Security of Your Information',
          text: 'We use administrative, technical, and physical security measures to protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable, and we cannot guarantee the security of your personal information.'
        },
        {
          heading: '7. Your Rights',
          text: 'Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your personal information. To exercise these rights, please contact us using the information provided at the end of this policy.'
        },
        {
          heading: '8. Children\'s Privacy',
          text: 'Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we learn we have collected or received personal information from a child under 16, we will delete that information.'
        },
        {
          heading: '9. Changes to This Privacy Policy',
          text: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.'
        },
        {
          heading: '10. Contact Us',
          text: 'If you have any questions about this Privacy Policy, please contact us at privacy@phoenixpress.com.'
        }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 1 يونيو 2024',
      sections: [
        {
          heading: '1. مقدمة',
          text: 'تلتزم فينيكس بريس ("نحن" أو "الخاص بنا") بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام والكشف عن وحماية معلوماتك عند زيارة موقعنا الإلكتروني أو استخدام خدماتنا. يرجى قراءة سياسة الخصوصية هذه بعناية. من خلال الاستمرار في استخدام موقعنا وخدماتنا، فإنك توافق على الممارسات الموصوفة في هذه السياسة.'
        },
        {
          heading: '2. المعلومات التي نجمعها',
          text: 'قد نجمع معلومات شخصية تقدمها طواعية عند تسجيل حساب، أو الاشتراك في نشرتنا الإخبارية، أو الرد على الاستطلاعات، أو الاتصال بنا. قد تشمل المعلومات الشخصية التي نجمعها اسمك وعنوان بريدك الإلكتروني وعنوانك البريدي ورقم هاتفك والمعلومات الديموغرافية. قد نقوم أيضًا بجمع معلومات معينة تلقائيًا عند زيارة موقعنا، بما في ذلك عنوان IP الخاص بك ونوع المتصفح ونظام التشغيل والموقع الإلكتروني المرجعي والصفحات التي تمت زيارتها وتواريخ/أوقات الزيارات.'
        },
        {
          heading: '3. كيف نستخدم معلوماتك',
          text: 'قد نستخدم المعلومات التي نجمعها لأغراض مختلفة، بما في ذلك: توفير وتشغيل وصيانة خدماتنا؛ تحسين وتخصيص وتوسيع خدماتنا؛ فهم وتحليل كيفية استخدامك لخدماتنا؛ تطوير منتجات وخدمات وميزات ووظائف جديدة؛ التواصل معك لخدمة العملاء والتحديثات والتسويق؛ معالجة المعاملات؛ منع المعاملات الاحتيالية؛ مراقبة وتحليل أنماط الاستخدام؛ والكشف عن المشكلات التقنية ومنعها ومعالجتها.'
        },
        {
          heading: '4. الكشف عن معلوماتك',
          text: 'قد نشارك معلوماتك مع أطراف ثالثة في حالات معينة. قد نشارك معلوماتك مع مقدمي الخدمات الذين يؤدون خدمات نيابة عنا، مثل معالجة الدفع وتحليل البيانات وتسليم البريد الإلكتروني وخدمات الاستضافة وخدمة العملاء. قد نشارك أيضًا معلوماتك عندما يكون ذلك مطلوبًا بموجب القانون أو لحماية حقوقنا.'
        },
        {
          heading: '5. ملفات تعريف الارتباط وتقنيات التتبع',
          text: 'نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لجمع معلومات حول أنشطة التصفح الخاصة بك. ملفات تعريف الارتباط هي ملفات صغيرة ينقلها موقع أو مقدم خدمة إلى جهازك مما يمكن الموقع من التعرف على متصفحك وتذكر معلومات معينة. يمكنك توجيه متصفحك لرفض جميع ملفات تعريف الارتباط أو للإشارة عند إرسال ملف تعريف ارتباط. ومع ذلك، إذا لم تقبل ملفات تعريف الارتباط، فقد لا تتمكن من استخدام بعض أجزاء من خدمتنا. لمزيد من المعلومات حول استخدامنا لملفات تعريف الارتباط، يرجى الاطلاع على سياسة ملفات تعريف الارتباط الخاصة بنا.'
        },
        {
          heading: '6. أمان معلوماتك',
          text: 'نستخدم إجراءات أمنية إدارية وتقنية ومادية لحماية معلوماتك الشخصية. في حين أننا اتخذنا خطوات معقولة لتأمين المعلومات الشخصية التي تقدمها لنا، يرجى أن تكون على علم بأنه لا توجد تدابير أمنية مثالية أو غير قابلة للاختراق، ولا يمكننا ضمان أمان معلوماتك الشخصية.'
        },
        {
          heading: '7. حقوقك',
          text: 'اعتمادًا على موقعك، قد يكون لديك بعض الحقوق المتعلقة بمعلوماتك الشخصية، مثل الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. لممارسة هذه الحقوق، يرجى الاتصال بنا باستخدام المعلومات المقدمة في نهاية هذه السياسة.'
        },
        {
          heading: '8. خصوصية الأطفال',
          text: 'خدماتنا غير مخصصة للأفراد دون سن 16 عامًا. نحن لا نجمع عن علم معلومات شخصية من الأطفال دون سن 16 عامًا. إذا علمنا أننا جمعنا أو تلقينا معلومات شخصية من طفل دون سن 16 عامًا، فسنقوم بحذف تلك المعلومات.'
        },
        {
          heading: '9. التغييرات في سياسة الخصوصية هذه',
          text: 'قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات من خلال نشر سياسة الخصوصية الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث". يُنصح بمراجعة سياسة الخصوصية هذه بشكل دوري لأي تغييرات.'
        },
        {
          heading: '10. اتصل بنا',
          text: 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على privacy@phoenixpress.com.'
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