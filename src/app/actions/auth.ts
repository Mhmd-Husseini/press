'use server';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type RegisterResult = {
  success: boolean;
  error?: string | z.ZodError;
  user?: any;
}

export async function register(formData: FormData): Promise<RegisterResult> {
  try {
    // Parse the form data
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
    };
    
    // Validate the data
    const validatedData = registerSchema.parse(rawData);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: 'USER' },
                create: { name: 'USER' }
              }
            }
          }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create JWT token and set cookie
    const token = sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return {
      success: true,
      user: userWithoutPassword
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error
      };
    }
    
    return {
      success: false,
      error: 'Registration failed'
    };
  }
}

// Login server action
export async function login(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create JWT token and set cookie
    const token = sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return {
      success: true,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Login failed'
    };
  }
}

// Logout server action
export async function logout() {
  // Clear the auth cookie
  const cookieStore = await cookies();
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });

  return {
    success: true
  };
}

// Get current user from token
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify the token
    const decoded = verify(token, JWT_SECRET) as { id: string };
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return null;
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
} 