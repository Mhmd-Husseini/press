'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';

export default function ContactPage() {
  const [currentLocale, setCurrentLocale] = useState('en');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Get locale from cookie
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
    
    if (cookieLocale) {
      setCurrentLocale(cookieLocale);
    }
  }, []);

  const isRTL = currentLocale === 'ar';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here you would normally send the data to your backend
    setSubmitted(true);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  // Bilingual content
  const content = {
    en: {
      title: "Contact Us",
      subtitle: "We'd love to hear from you",
      description: "Have questions, feedback, or a news tip? Our team is here to help. Fill out the form below and we'll get back to you as soon as possible.",
      nameLabel: "Your Name",
      namePlaceholder: "Enter your full name",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      subjectLabel: "Subject",
      subjectPlaceholder: "What is this regarding?",
      messageLabel: "Your Message",
      messagePlaceholder: "Please provide details of your inquiry...",
      submitButton: "Send Message",
      successMessage: "Thank you for your message! We will get back to you soon.",
      contactInformation: "Contact Information",
      phoneNumber: "+961-5-488447",
      emailAddress: "contact@ektisadi.com",
      hoursTitle: "Hours of Operation",
      hours: "24/7",
      weekend: "",
      addressTitle: "Headquarters",
      address: "Chouifat, Lebanon",
      cityState: "",
      country: "",
    },
    ar: {
      title: "اتصل بنا",
      subtitle: "يسعدنا سماع رأيك",
      description: "هل لديك أسئلة أو ملاحظات أو خبر عاجل؟ فريقنا هنا للمساعدة. املأ النموذج أدناه وسنرد عليك في أقرب وقت ممكن.",
      nameLabel: "الاسم الكامل",
      namePlaceholder: "أدخل اسمك الكامل",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "أدخل عنوان بريدك الإلكتروني",
      subjectLabel: "الموضوع",
      subjectPlaceholder: "ما هو استفسارك؟",
      messageLabel: "رسالتك",
      messagePlaceholder: "يرجى تقديم تفاصيل استفسارك...",
      submitButton: "إرسال الرسالة",
      successMessage: "شكرا لرسالتك! سنرد عليك قريبا.",
      contactInformation: "معلومات الاتصال",
      phoneNumber: "+961-5-488447",
      emailAddress: "contact@ektisadi.com",
      hoursTitle: "ساعات العمل",
      hours: "24/7",
      weekend: "",
      addressTitle: "العنوان",
      address: "الشويفات – لبنان",
      cityState: "",
      country: "",
    }
  };

  const c = content[currentLocale === 'ar' ? 'ar' : 'en'];

  return (
    <MainLayout>
      <div 
        className={`bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} 
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {c.title}
            </h1>
            <h2 className="text-xl text-amber-600 mt-2">
              {c.subtitle}
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl">
              {c.description}
            </p>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-green-700">
                    <h3 className="font-medium text-green-800">
                      {c.successMessage}
                    </h3>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="w-full">
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                          {c.nameLabel}
                        </label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          type="text"
                          id="name"
                          name="name"
                          placeholder={c.namePlaceholder}
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                          {c.emailLabel}
                        </label>
                        {/* Email addresses are always LTR */}
                        <input
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          type="email"
                          id="email"
                          name="email"
                          placeholder={c.emailPlaceholder}
                          value={formData.email}
                          onChange={handleChange}
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="subject">
                        {c.subjectLabel}
                      </label>
                      <input
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        type="text"
                        id="subject"
                        name="subject"
                        placeholder={c.subjectPlaceholder}
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mt-6">
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="message">
                        {c.messageLabel}
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-32"
                        id="message"
                        name="message"
                        rows={6}
                        placeholder={c.messagePlaceholder}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                    <div className="mt-6">
                      <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                      >
                        {c.submitButton}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {c.contactInformation}
                  </h3>

                  <div className="mt-6 flex items-start">
                    <div className={`${isRTL ? 'ml-3' : 'mr-3'} mt-1 bg-amber-100 p-2 rounded-full text-amber-600`}>
                      📞
                    </div>
                    <div>
                      {/* Phone numbers are always LTR */}
                      <p className="text-gray-900 font-medium" dir="ltr">
                        {c.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start">
                    <div className={`${isRTL ? 'ml-3' : 'mr-3'} mt-1 bg-amber-100 p-2 rounded-full text-amber-600`}>
                      📧
                    </div>
                    <div>
                      {/* Email addresses are always LTR */}
                      <p className="text-gray-900 font-medium" dir="ltr">
                        {c.emailAddress}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start">
                    <div className={`${isRTL ? 'ml-3' : 'mr-3'} mt-1 bg-amber-100 p-2 rounded-full text-amber-600`}>
                      🕒
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium mb-1">
                        {c.hoursTitle}
                      </p>
                      <p className="text-gray-600">
                        {c.hours}
                      </p>
                      <p className="text-gray-600">
                        {c.weekend}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start">
                    <div className={`${isRTL ? 'ml-3' : 'mr-3'} mt-1 bg-amber-100 p-2 rounded-full text-amber-600`}>
                      📍
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium mb-1">
                        {c.addressTitle}
                      </p>
                      <p className="text-gray-600">
                        {c.address}
                      </p>
                      <p className="text-gray-600">
                        {c.cityState}
                      </p>
                      <p className="text-gray-600">
                        {c.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Div */}
                <div className="mt-6 bg-white p-4 rounded-lg shadow-md text-center">
                  <h3 className="text-xl font-bold text-gray-900">إقتصادي.كوم</h3>
                  <p className="text-gray-600">
                    {isRTL ? 'أخبار الاقتصاد بلغة الناس' : 'Economic News in People\'s Language'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 