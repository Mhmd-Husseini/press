import { cookies } from 'next/headers';
import { Metadata } from 'next';
import MainLayout from '@/components/layouts/MainLayout';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'Terms of Service | Ektisadi.com',
  description: 'Terms and conditions for using Ektisadi.com services.',
};

export default async function TermsPage() {
  // Get current locale from cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ar';
  const isRTL = locale === 'ar';

  // Content for English and Arabic
  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: September 22, 2025',
      sections: [
        {
          heading: '1. Introduction',
          text: 'Welcome to Ektisadi.com ("the Website"). These Terms of Service ("Terms") govern your access to and use of the Website and all related services and applications (collectively referred to as "the Service"). Your access to or use of the Service constitutes explicit and binding acceptance of these Terms, in accordance with applicable Lebanese laws, particularly the Publications Law and the Audio-Visual Media Law where applicable.'
        },
        {
          heading: '2. Use of Service',
          text: 'The user undertakes to use the Service within the limits set forth in these Terms and in accordance with all applicable Lebanese laws and regulations. The user is prohibited from using the Service for any illegal, fraudulent, harmful, or activities contrary to public order and public morals.'
        },
        {
          heading: '3. Content and Intellectual Property',
          text: 'All materials published on Ektisadi.com, including but not limited to articles, studies, images, videos, and designs, are the exclusive property of the Website and subject to protection under Lebanese and international intellectual property, copyright, and trademark laws. Reproduction, distribution, modification, or creation of derivative works from the content is prohibited without obtaining prior written permission from the Website administration.'
        },
        {
          heading: '4. Modifications to Terms',
          text: 'Ektisadi.com administration reserves the right to modify these Terms in whole or in part at any time, provided that the modified version is published on the Website. The user\'s continued use of the Service after publication of modifications constitutes explicit and prior acceptance thereof.'
        },
        {
          heading: '5. Governing Law and Dispute Resolution',
          text: 'These Terms are subject to and interpreted in accordance with the provisions of applicable Lebanese laws. The competent Lebanese courts in Beirut have exclusive jurisdiction to consider any dispute that may arise from the interpretation or implementation of these Terms.'
        },
        {
          heading: '6. Contact Us',
          text: 'For any inquiries or comments related to these Terms, you can contact the Website administration via email: contact@ektisadi.com'
        }
      ]
    },
    ar: {
      title: 'شروط الخدمة',
      lastUpdated: 'آخر تحديث: 22 أيلول / سبتمبر 2025',
      sections: [
        {
          heading: '1 - المقدمة',
          text: 'مرحبًا بك في اقتصادي.كوم ("الموقع"). إن شروط الخدمة هذه ("الشروط") تنظّم وصولك إلى واستخدامك للموقع وكافة الخدمات والتطبيقات المرتبطة به (ويُشار إليها مجتمعة بـ"الخدمة"). إن دخولك إلى الخدمة أو استخدامها يشكّل قبولًا صريحًا وملزمًا بأحكام هذه الشروط، وذلك وفقًا للقوانين اللبنانية المرعية الإجراء، ولا سيما قانون المطبوعات وقانون الإعلام المرئي والمسموع حيثما ينطبق.'
        },
        {
          heading: '2 - استعمال الخدمة',
          text: 'يلتزم المستخدم باستخدام الخدمة ضمن الحدود المقررة في هذه الشروط ووفقًا لجميع القوانين والأنظمة اللبنانية المرعية الإجراء. يُحظر على المستخدم استعمال الخدمة في أي نشاط غير قانوني، أو احتيالي، أو ضار، أو مخالف للنظام العام والآداب العامة.'
        },
        {
          heading: '3 - المحتوى والملكية الفكرية',
          text: 'تُعتبر جميع المواد المنشورة على اقتصادي.كوم، بما في ذلك على سبيل المثال لا الحصر المقالات، الدراسات، الصور، مقاطع الفيديو، والتصاميم، ملكًا حصريًا للموقع وخاضعة لحماية قوانين الملكية الفكرية وحقوق النشر والعلامات التجارية اللبنانية والدولية. يُمنع إعادة إنتاج أو توزيع أو تعديل أو إنشاء أعمال مشتقة من المحتوى دون الحصول على إذن خطّي ومسبق من إدارة الموقع.'
        },
        {
          heading: '4 - التعديلات على الشروط',
          text: 'تحتفظ إدارة اقتصادي.كوم بالحق في تعديل هذه الشروط كليًا أو جزئيًا في أي وقت، على أن يُصار إلى نشر النسخة المعدّلة على الموقع. ويُعتبر استمرار المستخدم في استخدام الخدمة بعد نشر التعديلات بمثابة قبول صريح ومسبق لها.'
        },
        {
          heading: '5 - القانون الحاكم وحل النزاعات',
          text: 'تخضع هذه الشروط وتُفسّر وفقًا لأحكام القوانين اللبنانية النافذة. وتكون المحاكم اللبنانية المختصة في بيروت صاحبة الولاية الحصرية للنظر في أي نزاع قد ينشأ عن تفسير أو تنفيذ هذه الشروط.'
        },
        {
          heading: '6 - الاتصال بنا',
          text: 'لأي استفسارات أو ملاحظات تتعلق بهذه الشروط، يمكن التواصل مع إدارة الموقع عبر البريد الإلكتروني: contact@ektisadi.com'
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
          <h1 className="text-2xl font-bold mb-4">{pageContent.title}</h1>
          <p className="text-xs text-gray-500 mb-8">{pageContent.lastUpdated}</p>

          <div className="prose max-w-none">
            {pageContent.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-lg font-semibold mb-4">{section.heading}</h2>
                <p className="text-sm text-gray-700">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 