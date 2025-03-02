import { PrismaClient, Prisma, Post, PostStatus, PostTranslation, Media } from '@prisma/client';
import { BaseService } from '../base.service';
import prisma from '@/lib/prisma';

export type PostWithRelations = Post & {
  translations: PostTranslation[];
  category?: { 
    translations: { locale: string; name: string; slug: string }[]
  };
  authorName?: string;
  authorNameArabic?: string;
  author?: { 
    id: string; 
    email: string; 
    firstName?: string; 
    lastName?: string;
    firstNameArabic?: string;
    lastNameArabic?: string;
  };
  media?: Media[];
  tags?: { 
    tag: { 
      id: string; 
      name: string; 
      nameArabic?: string
    } 
  }[];
  createdBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  updatedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
};

export type PostCreateInput = {
  status?: PostStatus;
  authorId: string;
  authorName?: string;
  authorNameArabic?: string;
  categoryId: string;
  createdById?: string;
  updatedById?: string;
  featured?: boolean;
  metaData?: Record<string, any>;
  tags?: string[];
  translations: {
    locale: string;
    title: string;
    content: string;
    summary?: string;
    slug: string;
    dir?: string;
  }[];
};

export type PostUpdateInput = {
  status?: PostStatus;
  statusReason?: string;
  categoryId?: string;
  authorName?: string;
  authorNameArabic?: string;
  featured?: boolean;
  metaData?: Record<string, any>;
  tags?: string[];
  updatedById?: string;
  translations?: {
    id?: string;
    locale: string;
    title: string;
    content: string;
    summary?: string;
    slug: string;
    dir?: string;
  }[];
};

export class PostService extends BaseService<Prisma.PostDelegate<any>> {
  constructor() {
    super(
      prisma,
      prisma.post,
      []
    );
  }

  async create(data: PostCreateInput): Promise<PostWithRelations> {
    // Verify that translations contain at least one entry
    if (!data.translations || data.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Verify that slugs are unique
    for (const translation of data.translations) {
      const existingSlug = await this.prisma.postTranslation.findUnique({
        where: { slug: translation.slug }
      });

      if (existingSlug) {
        throw new Error(`Slug '${translation.slug}' already exists`);
      }
    }

    // Create post with translations
    const post = await this.prisma.post.create({
      data: {
        status: data.status || PostStatus.DRAFT,
        authorId: data.authorId,
        authorName: data.authorName,
        authorNameArabic: data.authorNameArabic,
        categoryId: data.categoryId,
        featured: data.featured || false,
        metaData: data.metaData || {},
        createdById: data.createdById,
        updatedById: data.updatedById,
        translations: {
          create: data.translations
        },
        ...(data.tags && data.tags.length > 0 && {
          tags: {
            create: data.tags.map(tagId => ({
              tag: {
                connect: { id: tagId }
              }
            }))
          }
        })
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true
          }
        },
        author: true,
        media: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return post;
  }

  async getAll(options?: {
    status?: PostStatus;
    locale?: string;
    categoryId?: string;
    authorId?: string;
    featured?: boolean;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: PostWithRelations[]; total: number; pages: number }> {
    const { 
      status, 
      locale, 
      categoryId, 
      authorId, 
      featured, 
      tag, 
      search, 
      page = 1, 
      limit = 10 
    } = options || {};

    // Build the where clause based on the filters
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(authorId && { authorId }),
      ...(featured !== undefined && { featured }),
      ...(tag && {
        tags: {
          some: {
            tag: {
              id: tag
            }
          }
        }
      }),
      ...(search && {
        OR: [
          {
            translations: {
              some: {
                title: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            translations: {
              some: {
                content: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            translations: {
              some: {
                summary: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          }
        ]
      })
    };

    // Count total posts matching the filters
    const total = await this.prisma.post.count({ where });
    const pages = Math.ceil(total / limit);

    // Get posts with pagination
    const posts = await this.prisma.post.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { featured: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: {
        translations: locale ? { where: { locale } } : true,
        category: {
          include: {
            translations: locale ? { where: { locale } } : true
          }
        },
        author: true,
        media: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return { posts, total, pages };
  }

  async getById(id: string, locale?: string): Promise<PostWithRelations | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        translations: locale ? { where: { locale } } : true,
        category: {
          include: {
            translations: locale ? { where: { locale } } : true
          }
        },
        author: true,
        media: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
  }

  async getBySlug(slug: string): Promise<PostWithRelations | null> {
    const translation = await this.prisma.postTranslation.findUnique({
      where: { slug },
      include: {
        post: {
          include: {
            translations: true,
            category: {
              include: {
                translations: true
              }
            },
            author: true,
            media: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    });

    return translation ? translation.post as PostWithRelations : null;
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });
  }

  async update(id: string, data: PostUpdateInput): Promise<PostWithRelations> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { translations: true }
    });

    if (!post) {
      throw new Error(`Post with ID ${id} not found`);
    }

    // Update status with timestamp if status changed
    let statusData = {};
    if (data.status && data.status !== post.status) {
      statusData = {
        status: data.status,
        statusReason: data.statusReason,
        statusUpdatedAt: new Date(),
        ...(data.status === PostStatus.PUBLISHED && { publishedAt: new Date() })
      };
    } else if (data.statusReason !== undefined && data.statusReason !== post.statusReason) {
      statusData = {
        statusReason: data.statusReason
      };
    }

    // Update base post data
    await this.prisma.post.update({
      where: { id },
      data: {
        ...statusData,
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.authorName !== undefined && { authorName: data.authorName }),
        ...(data.authorNameArabic !== undefined && { authorNameArabic: data.authorNameArabic }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.metaData !== undefined && { metaData: data.metaData }),
        ...(data.updatedById && { updatedById: data.updatedById })
      }
    });

    // Update tags if provided
    if (data.tags) {
      // Delete existing tags
      await this.prisma.postTag.deleteMany({
        where: { postId: id }
      });

      // Add new tags
      if (data.tags.length > 0) {
        await this.prisma.postTag.createMany({
          data: data.tags.map(tagId => ({
            postId: id,
            tagId
          }))
        });
      }
    }

    // Update translations if provided
    if (data.translations && data.translations.length > 0) {
      for (const translation of data.translations) {
        const existingTranslation = post.translations.find(t => t.locale === translation.locale);

        if (existingTranslation) {
          // Check slug uniqueness if it changed
          if (translation.slug !== existingTranslation.slug) {
            const slugExists = await this.prisma.postTranslation.findUnique({
              where: { 
                slug: translation.slug,
                NOT: {
                  id: existingTranslation.id
                }
              }
            });

            if (slugExists) {
              throw new Error(`Slug '${translation.slug}' already exists`);
            }
          }

          // Update existing translation
          await this.prisma.postTranslation.update({
            where: { id: existingTranslation.id },
            data: translation
          });
        } else {
          // Check slug uniqueness
          const slugExists = await this.prisma.postTranslation.findUnique({
            where: { slug: translation.slug }
          });

          if (slugExists) {
            throw new Error(`Slug '${translation.slug}' already exists`);
          }

          // Create new translation
          await this.prisma.postTranslation.create({
            data: {
              ...translation,
              postId: id
            }
          });
        }
      }
    }

    // Return the updated post with all relations
    return this.getById(id) as Promise<PostWithRelations>;
  }

  async softDelete(id: string): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async hardDelete(id: string): Promise<Post> {
    // Delete all translations first
    await this.prisma.postTranslation.deleteMany({
      where: { postId: id }
    });

    // Delete all tags associations
    await this.prisma.postTag.deleteMany({
      where: { postId: id }
    });

    // Then delete the post
    return this.prisma.post.delete({
      where: { id }
    });
  }

  async getTags(): Promise<any[]> {
    return this.prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  async createTag(name: string, nameArabic?: string): Promise<any> {
    return this.prisma.tag.create({
      data: {
        name,
        nameArabic
      }
    });
  }
} 