import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';
import { cookies } from 'next/headers';

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const authorId = resolvedParams.id;

    const author = await prisma.author.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return {
        title: 'Author Not Found | Ektisadi.com',
        description: 'The requested author could not be found.'
      };
    }

    const authorName = author.nameEn || 'Unknown Author';
    const authorBio = author.bio || `Read articles by ${authorName} on Ektisadi.com`;

    return {
      title: `${authorName} | Author Profile | Ektisadi.com`,
      description: authorBio,
      keywords: [
        authorName,
        'Author',
        'Ektisadi.com',
        'Lebanon',
        'News',
        'Articles'
      ].join(', '),
      openGraph: {
        title: `${authorName} | Author Profile`,
        description: authorBio,
        type: 'profile',
        images: author.avatar ? [
          {
            url: author.avatar,
            width: 400,
            height: 400,
            alt: `${authorName} profile picture`
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary',
        title: `${authorName} | Author Profile`,
        description: authorBio,
        images: author.avatar ? [author.avatar] : undefined,
      }
    };
  } catch (error) {
    return {
      title: 'Author Not Found | Ektisadi.com',
      description: 'The requested author could not be found.'
    };
  }
}

async function fetchAuthorData(authorId: string) {
  try {
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        posts: {
          where: {
            status: 'PUBLISHED'
          },
          include: {
            translations: {
              orderBy: {
                locale: 'asc'
              }
            },
            category: {
              include: {
                translations: true
              }
            },
            media: {
              include: {
                media: true
              }
            }
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!author) {
      return null;
    }

    // Calculate total post count
    const totalPosts = await prisma.post.count({
      where: {
        postAuthorId: authorId,
        status: 'PUBLISHED'
      }
    });

    return {
      ...author,
      totalPosts
    };
  } catch (error) {
    console.error('Error fetching author data:', error);
    return null;
  }
}

export default async function AuthorProfilePage({ params }: AuthorPageProps) {
  try {
    const resolvedParams = await params;
    const authorId = resolvedParams.id;

    // Get locale from cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const isRTL = locale === 'ar';

    const authorData = await fetchAuthorData(authorId);

    if (!authorData) {
      notFound();
    }

    const { posts, totalPosts, ...author } = authorData;

    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Hero Section */}
          <div className="bg-white shadow-lg">
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <nav className="mb-8">
                  <Link 
                    href="/" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    {locale === 'ar' ? 'الرئيسية' : 'Home'}
                  </Link>
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-600 text-sm">
                    {locale === 'ar' ? 'ملف الكاتب' : 'Author Profile'}
                  </span>
                </nav>

                {/* Author Info */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {author.avatar ? (
                      <div className="relative">
                        <Image
                          src={author.avatar}
                          alt={`${author.nameEn} profile picture`}
                          width={160}
                          height={160}
                          className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-2xl"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-2xl">
                        <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Author Details */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {author.nameEn}
                      </h1>
                      
                      {author.nameAr && (
                        <h2 className="text-xl text-gray-700 mb-3 font-arabic" dir="rtl">
                          {author.nameAr}
                        </h2>
                      )}

                      {author.country && (
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-base text-gray-600 font-medium">{author.country}</span>
                        </div>
                      )}
                    </div>

                    {author.bio && (
                      <div className="mb-6">
                        <p className="text-base text-gray-700 leading-relaxed">
                          {author.bio}
                        </p>
                      </div>
                    )}

                    {author.bioAr && (
                      <div className="mb-6">
                        <p className="text-base text-gray-700 leading-relaxed font-arabic" dir="rtl">
                          {author.bioAr}
                        </p>
                      </div>
                    )}

                    {/* Stats and Contact */}
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-blue-800">
                          {totalPosts} {totalPosts === 1 ? 'Article' : 'Articles'}
                        </span>
                      </div>
                      
                      {author.email && (
                        <a 
                          href={`mailto:${author.email}`}
                          className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full hover:bg-green-100 transition-colors"
                        >
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">
                            {locale === 'ar' ? 'تواصل مع الكاتب' : 'Contact Author'}
                          </span>
                        </a>
                      )}
                    </div>

                    {/* Social Links */}
                    {author.socialLinks && Object.keys(author.socialLinks).length > 0 && (
                      <div className="flex gap-3">
                        {Object.entries(author.socialLinks).map(([platform, url]) => (
                          url && (
                            <a
                              key={platform}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {platform}
                              </span>
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Articles */}
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {locale === 'ar' ? `مقالات حديثة من ${author.nameEn}` : `Recent Articles by ${author.nameEn}`}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
              </div>

              {posts.filter(post => post.translations && post.translations.some(t => t.locale === locale)).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts
                    .filter(post => post.translations && post.translations.some(t => t.locale === locale))
                    .map((post) => {
                    // Get the appropriate translation based on locale
                    const postTranslation = post.translations.find(t => t.locale === locale) || post.translations[0];
                    const categoryTranslation = post.category?.translations?.find(t => t.locale === locale) || post.category?.translations?.[0];
                    const featuredImage = post.media.find((pm: any) => pm.media.type === 'IMAGE')?.media;

                    return (
                      <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                        {/* Image */}
                        {featuredImage && (
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={featuredImage.url}
                              alt={postTranslation.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            
                            {/* Category Badge */}
                            {categoryTranslation && (
                              <div className="absolute top-4 left-4">
                                <Link
                                  href={`/categories/${categoryTranslation.slug}`}
                                  className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-800 rounded-full text-xs font-semibold hover:bg-white transition-colors"
                                >
                                  {categoryTranslation.name}
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                          {/* Title */}
                          <h3 className="text-lg font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
                            <Link href={`/posts/${postTranslation.slug}`}>
                              {postTranslation.title}
                            </Link>
                          </h3>

                          {/* Summary */}
                          {postTranslation.summary && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                              {postTranslation.summary}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <time dateTime={post.publishedAt?.toISOString()}>
                                {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), { 
                                  addSuffix: true,
                                  locale: postTranslation.locale === 'ar' ? ar : enUS
                                })}
                              </time>
                            </div>
                            
                            <Link
                              href={`/posts/${postTranslation.slug}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors group/link"
                            >
                              <span>{locale === 'ar' ? 'اقرأ المزيد' : 'Read More'}</span>
                              <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'لا توجد مقالات بعد' : 'No Articles Yet'}
                  </h3>
                  <p className="text-gray-500 text-base max-w-md mx-auto">
                    {locale === 'ar' ? 'لم ينشر هذا الكاتب أي مقالات حتى الآن.' : 'This author hasn\'t published any articles yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  } catch (error) {
    console.error('Error in AuthorProfilePage:', error);
    notFound();
  }
}
