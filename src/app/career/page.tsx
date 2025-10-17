import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import MainLayout from '@/components/layouts/MainLayout';

export const metadata: Metadata = {
  title: 'Careers | Ektisadi.com',
  description: 'Explore career opportunities at Ektisadi.com. Join our team of talented professionals.',
};

export default async function CareerPage() {
  // Get current locale from cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isRTL = locale === 'ar';

  // Bilingual content
  const content = {
    en: {
      title: 'Careers',
      subtitle: 'Join Our Team',
      description: 'Thank you for your interest in working with Ektisadi.com. We are committed to bringing together talented professionals who are passionate about journalism and media.',
      noVacancies: 'Currently, we have no open positions available.',
      checkLater: 'Please check back later for future opportunities.',
      contactUs: 'If you would like to submit your resume for future consideration, please email us at:',
      emailAddress: 'contact@ektisadi.com',
      returnHome: 'Return to Home'
    },
    ar: {
      title: 'الوظائف',
      subtitle: 'انضم إلى فريقنا',
      description: 'شكراً لاهتمامك بالعمل مع الاقتصادي. نحن ملتزمون بجمع المهنيين الموهوبين الذين يشعرون بشغف تجاه الصحافة والإعلام.',
      noVacancies: 'حالياً، لا توجد لدينا وظائف شاغرة متاحة.',
      checkLater: 'يرجى العودة لاحقاً للاطلاع على الفرص المستقبلية.',
      contactUs: 'إذا كنت ترغب في تقديم سيرتك الذاتية للنظر فيها مستقبلاً، يرجى مراسلتنا عبر البريد الإلكتروني:',
      emailAddress: 'contact@ektisadi.com',
      returnHome: 'العودة إلى الصفحة الرئيسية'
    }
  };

  return (
    <MainLayout locale={locale}>
      <div className={`container mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isRTL ? content.ar.title : content.en.title}
          </h1>
          
          <h2 className="text-lg font-semibold text-blue-600 mb-6">
            {isRTL ? content.ar.subtitle : content.en.subtitle}
          </h2>
          
          <div className="prose max-w-none mb-8">
            <p className="text-sm text-gray-700 mb-4">
              {isRTL ? content.ar.description : content.en.description}
            </p>
            
            <div className={`bg-gray-100 ${isRTL ? 'border-r-4' : 'border-l-4'} border-yellow-500 p-5 my-8`}>
              <p className="font-bold text-base mb-2">
                {isRTL ? content.ar.noVacancies : content.en.noVacancies}
              </p>
              <p className="text-sm">
                {isRTL ? content.ar.checkLater : content.en.checkLater}
              </p>
            </div>
            
            <p className="text-sm mb-2">
              {isRTL ? content.ar.contactUs : content.en.contactUs}
            </p>
            
            <p className="font-semibold text-sm text-blue-600 mb-8">
              <a href="mailto:contact@ektisadi.com" className="hover:underline">
                {isRTL ? content.ar.emailAddress : content.en.emailAddress}
              </a>
            </p>
            
            <div className="mt-10 text-center">
              <Link 
                href="/" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                {isRTL ? content.ar.returnHome : content.en.returnHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 