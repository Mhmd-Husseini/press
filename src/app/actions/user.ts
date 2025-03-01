'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { UserService, UserWithRoles } from '@/lib/services/user.service';
import { QueryParams } from '@/lib/query-builder';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  languagePreference: z.string().optional(),
  firstNameArabic: z.string().optional(),
  lastNameArabic: z.string().optional(),
  bioArabic: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  id: z.string(),
  password: z.string().min(6).optional(),
});

// Types
type UserResult = {
  success: boolean;
  user?: Omit<UserWithRoles, 'password'>;
  error?: string;
  users?: Array<Omit<UserWithRoles, 'password'>>;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Initialize service
const userService = new UserService();

/**
 * Create a new user
 */
export async function createUser(formData: FormData): Promise<UserResult> {
  try {
    const rawData = {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string,
      firstNameArabic: formData.get('firstNameArabic') as string,
      lastNameArabic: formData.get('lastNameArabic') as string,
      bio: formData.get('bio') as string,
      bioArabic: formData.get('bioArabic') as string,
      avatar: formData.get('avatar') as string,
      languagePreference: formData.get('languagePreference') as string,
      isActive: formData.get('isActive') === 'true',
    };

    // Validate data
    const validatedData = createUserSchema.parse(rawData);

    // Get roles from form data (as comma-separated string)
    const rolesString = formData.get('roles') as string;
    const roles = rolesString ? rolesString.split(',') : ['USER']; // Default to USER role

    // Create user through service
    const user = await userService.create(validatedData, roles);

    // Strip password from response
    const { password, ...userWithoutPassword } = user;

    revalidatePath('/admin/users');
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    };
  }
}

/**
 * Get all users with pagination
 */
export async function getUsers(
  page: number = 1, 
  limit: number = 10, 
  search?: string
): Promise<UserResult> {
  try {
    const queryParams: QueryParams = {
      page,
      limit,
      search,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    // Use the findAll method from BaseService
    const result = await userService.findAll(queryParams);
    
    // Remove passwords from users
    const usersWithoutPasswords = result.data.map((user: UserWithRoles) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return { 
      success: true, 
      users: usersWithoutPasswords,
      meta: result.meta
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: 'Failed to retrieve users' };
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<UserResult> {
  try {
    const user = await userService.findById(id);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Remove password
    const { password, ...userWithoutPassword } = user;
    
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: 'Failed to retrieve user' };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(formData: FormData): Promise<UserResult> {
  try {
    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'User ID is required' };
    }
    
    // Check if user exists
    const existingUser = await userService.findById(id);
    
    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }
    
    // Collect data from form
    const rawData = {
      id,
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string || undefined,
      firstNameArabic: formData.get('firstNameArabic') as string,
      lastNameArabic: formData.get('lastNameArabic') as string,
      bio: formData.get('bio') as string,
      bioArabic: formData.get('bioArabic') as string,
      avatar: formData.get('avatar') as string,
      languagePreference: formData.get('languagePreference') as string,
      isActive: formData.get('isActive') === 'true',
    };
    
    // Validate data
    const validatedData = updateUserSchema.parse(rawData);
    
    // Prepare update data - remove id from update data
    const { id: userId, ...updateData } = validatedData;
    
    // Handle password update separately
    const finalUpdateData: any = { ...updateData };
    if (finalUpdateData.password === undefined) {
      delete finalUpdateData.password;
    }
    
    // Get roles from form data
    const rolesString = formData.get('roles') as string;
    const roles = rolesString ? rolesString.split(',') : undefined;
    
    // Update user through service
    const updatedUser = await userService.update(id, finalUpdateData, roles);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser!;
    
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    
    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<UserResult> {
  try {
    // Delete user through service
    await userService.delete(id);
    
    revalidatePath('/admin/users');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
} 