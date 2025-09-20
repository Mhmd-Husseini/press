import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Terms of Service | Phoenix Press',
  description: 'Terms and conditions for using Phoenix Press services.',
};

export default async function TermsPage() {
  // Get current locale from cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isRTL = locale === 'ar';

  // Content for English and Arabic
  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: June 1, 2024',
      sections: [
        {
          heading: '1. Introduction',
          text: 'Welcome to Phoenix Press. These Terms of Service ("Terms") govern your access to and use of the Phoenix Press website, services, and applications (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.'
        },
        {
          heading: '2. Using Our Service',
          text: 'You may use our Service only as permitted by these Terms and any applicable laws. You may not use our Service to engage in illegal, fraudulent, or harmful activities.'
        },
        {
          heading: '3. Content and Intellectual Property',
          text: 'All content on Phoenix Press, including articles, images, videos, and other materials, is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of our content without explicit permission.'
        },
        {
          heading: '4. User Accounts',
          text: 'When you create an account with us, you must provide accurate and complete information. You are responsible for the security of your account and for all activities that occur under your account. We reserve the right to terminate accounts that violate our Terms.'
        },
        {
          heading: '5. Privacy',
          text: 'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and disclose information about you.'
        },
        {
          heading: '6. Limitation of Liability',
          text: 'To the maximum extent permitted by law, Phoenix Press will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.'
        },
        {
          heading: '7. Changes to Terms',
          text: 'We may modify these Terms at any time. We will provide notice of significant changes. Your continued use of the Service after such modifications constitutes your acceptance of the modified Terms.'
        },
        {
          heading: '8. Governing Law',
          text: 'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Phoenix Press is established, without regard to its conflict of law provisions.'
        },
        {
          heading: '9. Contact Us',
          text: 'If you have any questions about these Terms, please contact us at legal@phoenixpress.com.'
        }
      ]
    },
    ar: {
      title: 'شروط الخدمة',
      lastUpdated: 'آخر تحديث: 1 يونيو 2024',
      sections: [
        {
          heading: '1. مقدمة',
          text: 'مرحبًا بك في فينيكس بريس. تحكم شروط الخدمة هذه ("الشروط") وصولك إلى واستخدامك لموقع فينيكس بريس والخدمات والتطبيقات (مجتمعة، "الخدمة"). من خلال الوصول إلى الخدمة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط.'
        },
        {
          heading: '2. استخدام خدمتنا',
          text: 'يمكنك استخدام خدمتنا فقط على النحو المسموح به في هذه الشروط وأي قوانين معمول بها. لا يجوز لك استخدام خدمتنا للانخراط في أنشطة غير قانونية أو احتيالية أو ضارة.'
        },
        {
          heading: '3. المحتوى والملكية الفكرية',
          text: 'جميع المحتويات على فينيكس بريس، بما في ذلك المقالات والصور ومقاطع الفيديو والمواد الأخرى، محمية بموجب حقوق النشر والعلامات التجارية وقوانين الملكية الفكرية الأخرى. لا يجوز لك إعادة إنتاج أو توزيع أو تعديل أو إنشاء أعمال مشتقة من المحتوى الخاص بنا دون إذن صريح.'
        },
        {
          heading: '4. حسابات المستخدمين',
          text: 'عندما تقوم بإنشاء حساب معنا، يجب عليك تقديم معلومات دقيقة وكاملة. أنت مسؤول عن أمان حسابك وعن جميع الأنشطة التي تتم تحت حسابك. نحتفظ بالحق في إنهاء الحسابات التي تنتهك شروطنا.'
        },
        {
          heading: '5. الخصوصية',
          text: 'خصوصيتك مهمة بالنسبة لنا. يرجى مراجعة سياسة الخصوصية الخاصة بنا لفهم كيفية جمع واستخدام والكشف عن المعلومات المتعلقة بك.'
        },
        {
          heading: '6. تحديد المسؤولية',
          text: 'إلى أقصى حد يسمح به القانون، لن تكون فينيكس بريس مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، أو أي خسارة للأرباح أو الإيرادات، سواء تم تكبدها بشكل مباشر أو غير مباشر.'
        },
        {
          heading: '7. التغييرات في الشروط',
          text: 'قد نقوم بتعديل هذه الشروط في أي وقت. سنقدم إشعارًا بالتغييرات المهمة. يشكل استمرار استخدامك للخدمة بعد هذه التعديلات قبولًا منك للشروط المعدلة.'
        },
        {
          heading: '8. القانون الحاكم',
          text: 'تخضع هذه الشروط وتفسر وفقًا لقوانين الولاية القضائية التي تأسست فيها فينيكس بريس، بغض النظر عن أحكام تعارض القوانين.'
        },
        {
          heading: '9. اتصل بنا',
          text: 'إذا كان لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا على legal@phoenixpress.com.'
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
        </div>
      </div>
    </MainLayout>
  );
} 