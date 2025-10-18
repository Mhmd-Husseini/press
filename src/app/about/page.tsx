'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import Image from 'next/image';

export default function AboutPage() {
  const [currentLocale, setCurrentLocale] = useState('ar');

  useEffect(() => {
    // Get current locale from cookie
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'ar';
    
    setCurrentLocale(locale);
  }, []);

  const content = {
    en: {
      title: 'About Us',
      subtitle: 'About Ektisadi.com',
      mission: {
        title: 'Our Mission',
        text: 'Our economic website launched in 2025, a year marked by crises and anxiety at both regional and global levels, to provide a reliable and simplified platform that delivers economic news and analysis in the language of ordinary people. Our mission is to unravel the complexity that surrounds many Arab, regional, and global economic issues, bringing them closer to the ordinary reader without compromising depth or accuracy, keeping economics understandable and accessible to everyone, not monopolized by experts.'
      },
      values: {
        title: 'Our Values',
        items: [
          {
            title: 'Accuracy',
            text: 'Strict commitment to verifying information and presenting it with clarity and solid objectivity.'
          },
          {
            title: 'Independence',
            text: 'Complete editorial independence away from any influential political or commercial bias.'
          },
          {
            title: 'Freedom',
            text: 'Freedom of presentation and discussion without constraints, reflecting intellectual diversity and enriching public dialogue.'
          },
          {
            title: 'Transparency',
            text: 'Clarity in our sources and editorial approach to build genuine trust with our audience.'
          }
        ]
      },
      history: {
        title: 'Our History',
        text: 'Ektisadi.com launched on September 21, 2025, from a firm conviction that economics is a daily issue that affects the lives of individuals and communities, and should not remain captive to dry terminology or monopolized by experts. From here, it seeks to deconstruct Arab, regional, and global economic concepts and present them to the ordinary reader with reliability and accuracy, while maintaining the necessary analytical depth.'
      },
      team: {
        title: 'Our Team',
        text: 'The website includes an elite group of veteran economic journalists in coverage and analysis, alongside a generation of aspiring professionals who are taking steady steps towards professionalism. The team combines established expertise with creative energy, to provide solid economic content that is, at the same time, close to people\'s interests.'
      }
    },
    ar: {
      title: 'من نحن؟',
      subtitle: 'عن إقتصادي.كوم',
      mission: {
        title: 'مهمتنا',
        text: 'ينطلق موقعنا الاقتصادي في عام 2025، عام يموج بالأزمات والقلق على المستويين الإقليمي والعالمي، ليقدّم منصة موثوقة ومبسّطة تنقل الأخبار والتحليلات الاقتصادية بلغة عامة الناس. رسالتنا أن نفكّك التعقيد الذي يغلّف الكثير من القضايا الاقتصادية العربية والإقليمية والعالمية، فنقرّبها إلى القارئ العادي من دون إخلال بالعمق أو الدقة، ليبقى الاقتصاد مفهوماً متاحاً للجميع لا حكرًا على الخبراء.'
      },
      values: {
        title: 'قيمنا',
        items: [
          {
            title: 'الدقة',
            text: 'التزام صارم بالتحقق من المعلومات وصياغتها بوضوح وموضوعية راسخة.'
          },
          {
            title: 'الاستقلالية',
            text: 'استقلال تحريري كامل بعيدًا عن أي انحياز سياسي أو تجاري مؤثّر.'
          },
          {
            title: 'الحرية',
            text: 'حرية الطرح والنقاش بلا قيود، تعكس التعددية الفكرية وتثري الحوار العام.'
          },
          {
            title: 'الشفافية',
            text: 'وضوح في مصادرنا ونهجنا التحريري لبناء ثقة حقيقية مع جمهورنا.'
          }
        ]
      },
      history: {
        title: 'تاريخنا',
        text: 'انطلق موقع إقتصادي.كوم في 21 أيلول/ سبتمبر 2025، من قناعة راسخة بأن الاقتصاد قضية يومية تمسّ حياة الأفراد والمجتمعات، ولا يجوز أن يبقى أسيراً للمصطلحات الجافة أو محتكراً من قبل الخبراء. من هنا، يسعى إلى تفكيك المفاهيم الاقتصادية العربية والإقليمية والعالمية وتقديمها إلى القارئ العادي بموثوقية ودقّة، مع الحفاظ على العمق التحليلي اللازم.'
      },
      team: {
        title: 'فريقنا',
        text: 'يضمّ الموقع نخبة من الصحافيين الاقتصاديين المخضرمين في التغطية والتحليل، إلى جانب جيلٍ من الطامحين الذين يسيرون بخطوات ثابتة نحو الاحتراف. يجمع الفريق بين الخبرة الراسخة والطاقة الإبداعية، ليقدّم محتوى اقتصاديًا رصينًا، وفي الوقت نفسه قريبًا من اهتمامات الناس.'
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <h2 className="text-base text-gray-600 mb-8">{t.subtitle}</h2>

          {/* Mission Section */}
          <section className="mb-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.mission.title}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{t.mission.text}</p>
          </section>

          {/* Values Section */}
          <section className="mb-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.values.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.values.items.map((value, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-base font-semibold text-gray-900 mb-2">{value.title}</h4>
                  <p className="text-sm text-gray-700">{value.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* History Section */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.history.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{t.history.text}</p>
              </div>
              <div className="md:w-1/2">
                <div className="relative h-72 w-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-600 mb-4">E</div>
                    <p className="text-red-700 font-semibold text-base">Ektisadi.com</p>
                    <p className="text-red-600 text-sm mt-2">Economic News & Analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.team.title}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{t.team.text}</p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
} 