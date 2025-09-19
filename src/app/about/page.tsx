'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import Image from 'next/image';

export default function AboutPage() {
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    // Get current locale from cookie
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'en';
    
    setCurrentLocale(locale);
  }, []);

  const content = {
    en: {
      title: 'About Bidderij',
      subtitle: 'Delivering trusted news since 2005',
      mission: {
        title: 'Our Mission',
        text: 'Bidderij is dedicated to delivering accurate, impartial, and timely news coverage to audiences around the world. We strive to uphold the highest standards of journalism, ensuring that our reporting is factual, balanced, and comprehensive.'
      },
      values: {
        title: 'Our Values',
        items: [
          {
            title: 'Accuracy',
            text: 'We are committed to reporting the truth. Our journalists verify facts and sources before publishing.'
          },
          {
            title: 'Independence',
            text: 'We maintain editorial independence from political, commercial, and other influences that could compromise our integrity.'
          },
          {
            title: 'Fairness',
            text: 'We present multiple perspectives on complex issues, avoiding bias and providing context for our audience.'
          },
          {
            title: 'Transparency',
            text: 'We are open about our methods and sources wherever possible, and we promptly correct errors when they occur.'
          }
        ]
      },
      history: {
        title: 'Our History',
        text: 'Founded in 2005, Bidderij began as a small digital news platform covering local events. Over the years, we have grown into a comprehensive news organization with correspondents in major cities worldwide. Our commitment to quality journalism has earned us numerous awards and the trust of millions of readers who rely on us for their daily news.'
      },
      team: {
        title: 'Our Team',
        text: 'Our diverse team includes award-winning journalists, experienced editors, and digital media specialists dedicated to bringing you the news that matters. With backgrounds in various fields and specialties, our team brings rich perspectives to our coverage.'
      }
    },
    ar: {
      title: 'عن فينيكس برس',
      subtitle: 'نقدم أخبارًا موثوقة منذ 2005',
      mission: {
        title: 'مهمتنا',
        text: 'تكرس فينيكس برس جهودها لتقديم تغطية إخبارية دقيقة ومحايدة وفي الوقت المناسب للجماهير في جميع أنحاء العالم. نسعى جاهدين للحفاظ على أعلى معايير الصحافة، مما يضمن أن تقاريرنا واقعية ومتوازنة وشاملة.'
      },
      values: {
        title: 'قيمنا',
        items: [
          {
            title: 'الدقة',
            text: 'نحن ملتزمون بنقل الحقيقة. يتحقق صحفيونا من الحقائق والمصادر قبل النشر.'
          },
          {
            title: 'الاستقلالية',
            text: 'نحافظ على الاستقلالية التحريرية من التأثيرات السياسية والتجارية وغيرها التي يمكن أن تضر بنزاهتنا.'
          },
          {
            title: 'العدالة',
            text: 'نقدم وجهات نظر متعددة حول القضايا المعقدة، ونتجنب التحيز ونقدم السياق لجمهورنا.'
          },
          {
            title: 'الشفافية',
            text: 'نحن منفتحون على أساليبنا ومصادرنا حيثما أمكن ذلك، ونصحح الأخطاء فور حدوثها.'
          }
        ]
      },
      history: {
        title: 'تاريخنا',
        text: 'تأسست فينيكس برس في عام 2005، وبدأت كمنصة إخبارية رقمية صغيرة تغطي الأحداث المحلية. على مر السنين، نمونا لنصبح مؤسسة إخبارية شاملة مع مراسلين في المدن الرئيسية في جميع أنحاء العالم. لقد أكسبنا التزامنا بالصحافة الجيدة العديد من الجوائز وثقة الملايين من القراء الذين يعتمدون علينا للحصول على أخبارهم اليومية.'
      },
      team: {
        title: 'فريقنا',
        text: 'يضم فريقنا المتنوع صحفيين حائزين على جوائز، ومحررين ذوي خبرة، ومتخصصين في وسائل الإعلام الرقمية مكرسين لتقديم الأخبار المهمة لك. مع خلفيات في مختلف المجالات والتخصصات، يجلب فريقنا وجهات نظر غنية لتغطيتنا.'
      }
    }
  };

  const locale = currentLocale === 'ar' ? 'ar' : 'en';
  const t = content[locale];
  const isRTL = locale === 'ar';

  return (
    <MainLayout>
      <div className={`container mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <h2 className="text-xl text-gray-600 mb-8">{t.subtitle}</h2>

          {/* Mission Section */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.mission.title}</h3>
            <p className="text-gray-700 leading-relaxed">{t.mission.text}</p>
          </section>

          {/* Values Section */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t.values.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.values.items.map((value, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h4>
                  <p className="text-gray-700">{value.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* History Section */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.history.title}</h3>
                <p className="text-gray-700 leading-relaxed">{t.history.text}</p>
              </div>
              <div className="md:w-1/2">
                <div className="relative h-72 w-full rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/bidderij-logo.svg"
                    alt="Bidderij Logo"
                    fill
                    className="object-contain bg-gray-900 p-12"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.team.title}</h3>
            <p className="text-gray-700 leading-relaxed mb-8">{t.team.text}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    <div className="flex items-center justify-center h-full">
                      <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-gray-900">{isRTL ? 'اسم الموظف' : 'Team Member'} {index}</p>
                    <p className="text-sm text-gray-500">{isRTL ? 'المنصب' : 'Position'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
} 