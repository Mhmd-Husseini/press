import { PrismaClient, Prisma, Category, CategoryTranslation } from '@prisma/client';
import { BaseService } from '../base.service';
import prisma from '@/lib/prisma';

export type CategoryWithTranslations = Category & {
  translations: CategoryTranslation[];
  children?: CategoryWithTranslations[];
  parent?: CategoryWithTranslations | null;
};

export type CategoryCreateInput = {
  parentId?: string | null;
  order?: number;
  translations: {
    locale: string;
    name: string;
    description?: string;
    slug: string;
    dir?: string;
  }[];
};

export type CategoryUpdateInput = {
  parentId?: string | null;
  order?: number;
  translations?: {
    id?: string;
    locale: string;
    name: string;
    description?: string;
    slug: string;
    dir?: string;
  }[];
};

export class CategoryService extends BaseService<Prisma.CategoryDelegate<any>> {
  constructor() {
    super(
      prisma,
      prisma.category,
      []
    );
  }

  async create(data: CategoryCreateInput): Promise<CategoryWithTranslations> {
    // Verify that translations contain at least one entry
    if (!data.translations || data.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Verify that slugs are unique
    for (const translation of data.translations) {
      const existingSlug = await this.prisma.categoryTranslation.findUnique({
        where: { slug: translation.slug }
      });

      if (existingSlug) {
        throw new Error(`Slug '${translation.slug}' already exists`);
      }
    }

    return this.prisma.category.create({
      data: {
        parentId: data.parentId || null,
        order: data.order || 0,
        translations: {
          create: data.translations
        }
      },
      include: {
        translations: true
      }
    });
  }

  async getAll(locale?: string): Promise<CategoryWithTranslations[]> {
    // Get all categories with translations
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null
      },
      include: {
        translations: true,
        children: {
          include: {
            translations: true
          }
        },
        parent: {
          include: {
            translations: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Filter by locale if provided
    if (locale) {
      categories.forEach(category => {
        category.translations = category.translations.filter(t => t.locale === locale);
      });
    }

    // Return top-level categories (those without a parent)
    return categories.filter(category => !category.parentId);
  }

  async getAllFlat(): Promise<CategoryWithTranslations[]> {
    return this.prisma.category.findMany({
      where: {
        deletedAt: null
      },
      include: {
        translations: true,
        parent: {
          include: {
            translations: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getById(id: string): Promise<CategoryWithTranslations | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
        parent: {
          include: {
            translations: true
          }
        },
        children: {
          include: {
            translations: true
          }
        }
      }
    });
  }

  async getBySlug(slug: string): Promise<CategoryWithTranslations | null> {
    const translation = await this.prisma.categoryTranslation.findUnique({
      where: { slug },
      include: {
        category: {
          include: {
            translations: true,
            parent: {
              include: {
                translations: true
              }
            },
            children: {
              include: {
                translations: true
              }
            }
          }
        }
      }
    });

    return translation ? translation.category as CategoryWithTranslations : null;
  }

  async update(id: string, data: CategoryUpdateInput): Promise<CategoryWithTranslations> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { translations: true }
    });

    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Update the category base data
    await this.prisma.category.update({
      where: { id },
      data: {
        parentId: data.parentId,
        order: data.order
      }
    });

    // Update translations if provided
    if (data.translations && data.translations.length > 0) {
      for (const translation of data.translations) {
        const existingTranslation = category.translations.find(t => t.locale === translation.locale);

        if (existingTranslation) {
          // Check slug uniqueness if it changed
          if (translation.slug !== existingTranslation.slug) {
            const slugExists = await this.prisma.categoryTranslation.findUnique({
              where: { slug: translation.slug }
            });

            if (slugExists) {
              throw new Error(`Slug '${translation.slug}' already exists`);
            }
          }

          // Update existing translation
          await this.prisma.categoryTranslation.update({
            where: { id: existingTranslation.id },
            data: translation
          });
        } else {
          // Check slug uniqueness
          const slugExists = await this.prisma.categoryTranslation.findUnique({
            where: { slug: translation.slug }
          });

          if (slugExists) {
            throw new Error(`Slug '${translation.slug}' already exists`);
          }

          // Create new translation
          await this.prisma.categoryTranslation.create({
            data: {
              ...translation,
              categoryId: id
            }
          });
        }
      }
    }

    // Return the updated category with translations
    return this.getById(id) as Promise<CategoryWithTranslations>;
  }

  async softDelete(id: string): Promise<Category> {
    // Check if the category has children
    const children = await this.prisma.category.findMany({
      where: { parentId: id }
    });

    if (children.length > 0) {
      throw new Error('Cannot delete a category with children. Please delete or reassign the children first.');
    }

    // Check if the category has posts
    const posts = await this.prisma.post.findMany({
      where: { categoryId: id }
    });

    if (posts.length > 0) {
      throw new Error('Cannot delete a category with posts. Please reassign the posts first.');
    }

    // Soft delete by setting deletedAt timestamp
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async hardDelete(id: string): Promise<Category> {
    // Check if the category has children
    const children = await this.prisma.category.findMany({
      where: { parentId: id }
    });

    if (children.length > 0) {
      throw new Error('Cannot delete a category with children. Please delete or reassign the children first.');
    }

    // Check if the category has posts
    const posts = await this.prisma.post.findMany({
      where: { categoryId: id }
    });

    if (posts.length > 0) {
      throw new Error('Cannot delete a category with posts. Please reassign the posts first.');
    }

    // Delete all translations first
    await this.prisma.categoryTranslation.deleteMany({
      where: { categoryId: id }
    });

    // Then delete the category
    return this.prisma.category.delete({
      where: { id }
    });
  }

  async reorder(categoryIds: string[]): Promise<void> {
    // Update order for each category
    await Promise.all(
      categoryIds.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { order: index }
        })
      )
    );
  }

  async getPaginated(options?: {
    locale?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    categories: CategoryWithTranslations[];
    total: number;
    pages: number;
    page: number;
    limit: number;
  }> {
    const { locale, page = 1, limit = 10, search = '' } = options || {};
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
                { slug: { contains: search, mode: 'insensitive' as const } }
              ]
            }
          }
        }
      : {};

    // Build where clause
    const where = {
      deletedAt: null,
      ...searchConditions
    };

    // Get total count
    const total = await this.prisma.category.count({ where });

    // Get categories with pagination
    const categories = await this.prisma.category.findMany({
      where,
      include: {
        translations: locale ? { where: { locale } } : true,
        parent: {
          include: {
            translations: locale ? { where: { locale } } : true
          }
        },
        children: {
          include: {
            translations: locale ? { where: { locale } } : true
          }
        },
        _count: {
          select: { posts: true }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    const pages = Math.ceil(total / limit);

    return {
      categories: categories as CategoryWithTranslations[],
      total,
      pages,
      page,
      limit
    };
  }
} 