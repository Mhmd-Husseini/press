import { PrismaClient, Prisma, Post, PostStatus, PostTranslation, Media } from '@prisma/client';
import { BaseService } from '../base.service';
import prisma from '@/lib/prisma';
import { generatePostSlug } from '../utils';

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
  postAuthor?: {
    id: string;
    nameEn: string;
    nameAr?: string;
    country?: string;
    bio?: string;
    bioAr?: string;
    avatar?: string;
  };
  editor?: { 
    id: string; 
    email: string; 
    firstName?: string; 
    lastName?: string;
  };
  approvedBy?: { 
    id: string; 
    email: string; 
    firstName?: string; 
    lastName?: string;
  };
  declinedBy?: { 
    id: string; 
    email: string; 
    firstName?: string; 
    lastName?: string;
  };
  publishedBy?: { 
    id: string; 
    email: string; 
    firstName?: string; 
    lastName?: string;
  };
  unpublishedBy?: { 
    id: string; 
    email: string; 
    firstName?: string; 
    lastName?: string;
  };
  media?: { media: Media }[];
  tags?: { 
    tag: { 
      id: string; 
      name: string; 
      nameArabic?: string
    } 
  }[];
  revisionHistory?: {
    id: string;
    title: string;
    titleArabic?: string;
    status: PostStatus;
    changedById: string;
    changedBy: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    changeNote?: string;
    createdAt: Date;
  }[];
  statusReason?: string;
  declineReason?: string;
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
  statusReason?: string;
  authorId: string;
  postAuthorId: string;
  editorId?: string;
  approvedById?: string;
  declinedById?: string;
  publishedById?: string;
  unpublishedById?: string;
  categoryId: string;
  createdById?: string;
  updatedById?: string;
  featured?: boolean;
  metaData?: Record<string, any>;
  tags?: string[];
  mediaIds?: string[];
  declineReason?: string;
  changeNote?: string;
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
  authorId?: string;
  postAuthorId?: string;
  editorId?: string;
  approvedById?: string;
  declinedById?: string;
  publishedById?: string;
  unpublishedById?: string;
  featured?: boolean;
  metaData?: Record<string, any>;
  tags?: string[];
  updatedById?: string;
  declineReason?: string;
  changeNote?: string;
  mediaIds?: string[];
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

interface TranslationUpsert {
  where: { id: string };
  update: {
    id: string;
    locale: string;
    title: string;
    content: string;
    summary?: string;
    slug: string;
    dir?: string;
  };
  create: {
    id: string;
    locale: string;
    title: string;
    content: string;
    summary?: string;
    slug: string;
    dir?: string;
  };
}

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

    // Auto-generate slugs for translations that don't have them
    const processedTranslations = data.translations.map(translation => {
      if (!translation.slug && translation.title) {
        return {
          ...translation,
          slug: generatePostSlug(translation.title, translation.locale)
        };
      }
      return translation;
    });


    // Verify that slugs are unique
    for (const translation of processedTranslations) {
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
        statusReason: data.statusReason,
        authorId: data.authorId,
        postAuthorId: data.postAuthorId,
        categoryId: data.categoryId,
        featured: data.featured || false,
        metaData: data.metaData || {},
        createdById: data.createdById,
        updatedById: data.updatedById,
        editorId: data.editorId,
        approvedById: data.approvedById,
        declinedById: data.declinedById,
        publishedById: data.publishedById,
        unpublishedById: data.unpublishedById,
        declineReason: data.declineReason,
        translations: {
          create: processedTranslations
        },
        ...(data.tags && data.tags.length > 0 && {
          tags: {
            create: data.tags.map(tagId => ({
              tag: {
                connect: { id: tagId }
              }
            }))
          }
        }),
        ...(data.mediaIds && data.mediaIds.length > 0 && {
          media: {
            create: data.mediaIds.map(mediaId => ({
              media: {
                connect: { id: mediaId }
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
        postAuthor: true,
        editor: true,
        approvedBy: true,
        declinedBy: true,
        publishedBy: true,
        unpublishedBy: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    }) as unknown as PostWithRelations;

    // Create initial revision history entry
    if (post) {
      await (this.prisma as any).postRevision.create({
        data: {
          postId: post.id,
          title: processedTranslations[0].title,
          titleArabic: processedTranslations.find(t => t.locale === 'ar')?.title,
          content: processedTranslations[0].content,
          contentArabic: processedTranslations.find(t => t.locale === 'ar')?.content,
          excerpt: processedTranslations[0].summary,
          excerptArabic: processedTranslations.find(t => t.locale === 'ar')?.summary,
          status: post.status,
          changedById: data.createdById || data.authorId,
          changeNote: data.changeNote || 'Initial creation'
        }
      });
    }

    return post;
  }

  async getAll(options?: {
    status?: PostStatus | PostStatus[];
    locale?: string;
    categoryId?: string;
    authorId?: string;
    editorId?: string;
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
      editorId,
      featured, 
      tag, 
      search, 
      page = 1, 
      limit = 10 
    } = options || {};

    // Build the where clause based on the filters
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(status && (Array.isArray(status) ? { status: { in: status } } : { status })),
      ...(categoryId && { categoryId }),
      ...(authorId && { authorId }),
      ...(editorId && { editorId }),
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
        { createdAt: 'desc' }
      ],
      include: {
        translations: locale ? { where: { locale } } : true,
        category: {
          include: {
            translations: locale ? { where: { locale } } : true
          }
        },
        author: true,
        postAuthor: true,
        editor: true,
        approvedBy: true,
        declinedBy: true,
        publishedBy: true,
        unpublishedBy: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        revisionHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            changedBy: true
          }
        }
      }
    }) as unknown as PostWithRelations[];

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
        postAuthor: true,
        editor: true,
        approvedBy: true,
        declinedBy: true,
        publishedBy: true,
        unpublishedBy: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        revisionHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          include: {
            changedBy: true
          }
        }
      }
    }) as unknown as PostWithRelations | null;
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
            postAuthor: true,
            editor: true,
            approvedBy: true,
            publishedBy: true,
            media: {
          include: {
            media: true
          }
        },
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
    // Get the current post to compare changes
    const currentPost = await this.prisma.post.findUnique({
      where: { id },
      include: {
        translations: true
      }
    });

    if (!currentPost) {
      throw new Error('Post not found');
    }

    // Handle status changes with special actions
    let updateData: any = {
      ...data,
    };

    // Transform all relationship IDs to proper Prisma format
    // Category relationship
    if (data.categoryId !== undefined) {
      updateData.category = {
        connect: { id: data.categoryId }
      };
      delete updateData.categoryId;
    }

    // Author relationship (if needed in updates)
    if (data.authorId) {
      updateData.author = {
        connect: { id: data.authorId }
      };
      delete updateData.authorId;
    }

    // PostAuthor relationship
    if (data.postAuthorId) {
      updateData.postAuthor = {
        connect: { id: data.postAuthorId }
      };
      delete updateData.postAuthorId;
    }

    // Editor relationship
    if (data.editorId) {
      updateData.editor = {
        connect: { id: data.editorId }
      };
      delete updateData.editorId;
    }

    // ApprovedBy relationship
    if (data.approvedById) {
      updateData.approvedBy = {
        connect: { id: data.approvedById }
      };
      delete updateData.approvedById;
    }

    // DeclinedBy relationship
    if (data.declinedById) {
      updateData.declinedBy = {
        connect: { id: data.declinedById }
      };
      delete updateData.declinedById;
    }

    // PublishedBy relationship
    if (data.publishedById) {
      updateData.publishedBy = {
        connect: { id: data.publishedById }
      };
      delete updateData.publishedById;
    }

    // UnpublishedBy relationship
    if (data.unpublishedById) {
      updateData.unpublishedBy = {
        connect: { id: data.unpublishedById }
      };
      delete updateData.unpublishedById;
    }

    // UpdatedBy relationship
    if (data.updatedById) {
      updateData.updatedBy = {
        connect: { id: data.updatedById }
      };
      delete updateData.updatedById;
    }

    // Handle mediaIds if provided
    if (data.mediaIds && Array.isArray(data.mediaIds)) {
      updateData.media = {
        deleteMany: {}, // Delete all current media associations
        create: data.mediaIds.map(mediaId => ({
          media: {
            connect: { id: mediaId }
          }
        }))
      };
      delete updateData.mediaIds;
    }

    // Update status and record appropriate timestamps
    if (data.status) {
      switch (data.status) {
        case PostStatus.PUBLISHED:
          if (currentPost.status !== PostStatus.PUBLISHED) {
            updateData.publishedAt = new Date();
          }
          break;
        case PostStatus.UNPUBLISHED:
          // No additional timestamp needed
          break;
        case PostStatus.ARCHIVED:
          updateData.archivedAt = new Date();
          break;
        case PostStatus.WAITING_APPROVAL:
          // If submitting for approval, reset any previous decline reason
          updateData.declineReason = null;
          break;
        case PostStatus.READY_TO_PUBLISH:
          // No additional timestamp needed
          break;
        case PostStatus.DECLINED:
          // For decline reason, we use the direct field as it's not a relationship
          break;
      }
    }

    // If this is an edit (not just a status change), record the editor
    if (data.translations && data.translations.length > 0 && data.updatedById && !data.editorId) {
      // Only set editorId if not explicitly provided
      updateData.editor = {
        connect: { id: data.updatedById }
      };
    }

    // Process translations
    let translationUpserts = [];
    if (data.translations) {
      translationUpserts = data.translations.map(translation => {
        // Check if translation exists
        const existingTranslation = currentPost.translations.find(
          t => t.locale === translation.locale
        );

        // Auto-generate slug if title has changed
        let updatedTranslation = { ...translation };
        if (existingTranslation && translation.title !== existingTranslation.title) {
          updatedTranslation.slug = generatePostSlug(translation.title, translation.locale);
        } else if (!existingTranslation && translation.title) {
          // For new translations, generate slug if not provided
          updatedTranslation.slug = translation.slug || generatePostSlug(translation.title, translation.locale);
        }

        // If it exists, update it, otherwise create it
        if (existingTranslation) {
          return {
            where: {
              id: existingTranslation.id
            },
            update: updatedTranslation,
            create: {
              ...updatedTranslation,
              postId: id // Need to specify postId for create
            }
          };
        } else {
          return {
            where: {
              // Use a condition that will always trigger create
              id: 'non-existent-id'
            },
            update: updatedTranslation,
            create: {
              ...updatedTranslation,
              postId: id
            }
          };
        }
      });
    }

    // Process tags if provided
    const tagUpdates = data.tags
      ? { 
          deleteMany: {}, // Delete all current tags
          create: data.tags.map(tagId => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      : undefined;

    // Perform the update
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        translations: data.translations ? {
          upsert: data.translations.map(translation => {
            const existingTranslation = currentPost.translations.find(
              t => t.locale === translation.locale
            );

            // Auto-generate slug if title has changed
            let updatedTranslation = { ...translation };
            if (existingTranslation && translation.title !== existingTranslation.title) {
              updatedTranslation.slug = generatePostSlug(translation.title, translation.locale);
            } else if (!existingTranslation && translation.title) {
              // For new translations, generate slug if not provided
              updatedTranslation.slug = translation.slug || generatePostSlug(translation.title, translation.locale);
            }

            return {
              where: { 
                id: existingTranslation?.id || 'non-existent-id'
              },
              update: {
                locale: updatedTranslation.locale,
                title: updatedTranslation.title,
                content: updatedTranslation.content,
                summary: updatedTranslation.summary,
                slug: updatedTranslation.slug,
                dir: updatedTranslation.dir
              },
              create: {
                locale: updatedTranslation.locale,
                title: updatedTranslation.title,
                content: updatedTranslation.content,
                summary: updatedTranslation.summary,
                slug: updatedTranslation.slug,
                dir: updatedTranslation.dir
              }
            };
          })
        } : undefined,
        tags: tagUpdates
      },
      include: {
        translations: true,
        category: {
          include: {
            translations: true
          }
        },
        author: true,
        postAuthor: true,
        editor: true,
        approvedBy: true,
        declinedBy: true,
        publishedBy: true,
        unpublishedBy: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    }) as unknown as PostWithRelations;

    // Create revision history entry
    if (updatedPost && (data.translations || data.status)) {
      await (this.prisma as any).postRevision.create({
        data: {
          postId: updatedPost.id,
          title: updatedPost.translations[0]?.title || '',
          titleArabic: updatedPost.translations.find(t => t.locale === 'ar')?.title || null,
          content: updatedPost.translations[0]?.content || '',
          contentArabic: updatedPost.translations.find(t => t.locale === 'ar')?.content || null,
          excerpt: updatedPost.translations[0]?.summary || null,
          excerptArabic: updatedPost.translations.find(t => t.locale === 'ar')?.summary || null,
          status: updatedPost.status,
          changedById: data.updatedById || updatedPost.authorId,
          changeNote: data.changeNote || this.getStatusChangeNote(currentPost.status, updatedPost.status)
        }
      });
    }

    return updatedPost;
  }

  // Helper to create meaningful change notes for status changes
  private getStatusChangeNote(oldStatus: PostStatus, newStatus: PostStatus): string {
    if (oldStatus === newStatus) {
      return 'Updated content';
    }

    switch (newStatus) {
      case PostStatus.DRAFT:
        return 'Saved as draft';
      case PostStatus.WAITING_APPROVAL:
        return 'Submitted for approval';
      case PostStatus.READY_TO_PUBLISH:
        return 'Approved and ready to publish';
      case PostStatus.PUBLISHED:
        return 'Published';
      case PostStatus.UNPUBLISHED:
        return 'Unpublished';
      case PostStatus.ARCHIVED:
        return 'Archived';
      case PostStatus.DECLINED:
        return 'Declined';
      default:
        return 'Status changed';
    }
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

  // Get all posts waiting for approval
  async getAwaitingApproval(options?: {
    locale?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: PostWithRelations[]; total: number; pages: number }> {
    return this.getAll({
      status: PostStatus.WAITING_APPROVAL,
      ...options
    });
  }

  // Get all posts ready to publish
  async getReadyToPublish(options?: {
    locale?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: PostWithRelations[]; total: number; pages: number }> {
    return this.getAll({
      status: PostStatus.READY_TO_PUBLISH,
      ...options
    });
  }

  // Get post revision history
  async getRevisionHistory(postId: string): Promise<any[]> {
    return (this.prisma as any).postRevision.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        changedBy: true
      }
    });
  }

  // Change post status with reason and tracking
  async changeStatus(
    id: string, 
    status: PostStatus, 
    userId: string,
    reason?: string,
    changeNote?: string
  ): Promise<PostWithRelations> {
    const post = await this.prisma.post.findUnique({ 
      where: { id },
      include: { translations: true }
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    const updateData: any = {
      status,
      updatedById: userId,
      statusReason: reason,
      statusUpdatedAt: new Date()
    };
    
    // Set additional fields based on status
    switch (status) {
      case PostStatus.PUBLISHED:
        updateData.publishedAt = new Date();
        updateData.publishedById = userId;
        break;
      case PostStatus.UNPUBLISHED:
        updateData.unpublishedById = userId;
        break;
      case PostStatus.READY_TO_PUBLISH:
        updateData.approvedById = userId;
        break;
      case PostStatus.DECLINED:
        updateData.declinedById = userId;
        updateData.declineReason = reason;
        break;
      case PostStatus.WAITING_APPROVAL:
        updateData.declineReason = null;
        break;
      case PostStatus.ARCHIVED:
        updateData.archivedAt = new Date();
        break;
    }
    
    // Update the post
    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
        category: {
          include: {
            translations: true
          }
        },
        author: true,
        editor: true,
        approvedBy: true,
        declinedBy: true,
        publishedBy: true,
        unpublishedBy: true,
        media: {
          include: {
            media: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    }) as unknown as PostWithRelations;
    
    // Create revision history entry
    await (this.prisma as any).postRevision.create({
      data: {
        postId: updatedPost.id,
        title: updatedPost.translations[0]?.title || '',
        titleArabic: updatedPost.translations.find((t: any) => t.locale === 'ar')?.title || null,
        excerpt: updatedPost.translations[0]?.summary || null,
        excerptArabic: updatedPost.translations.find((t: any) => t.locale === 'ar')?.summary || null,
        status: updatedPost.status,
        changedById: userId,
        changeNote: changeNote || this.getStatusChangeNote(post.status, status)
      }
    });
    
    return updatedPost;
  }
} 