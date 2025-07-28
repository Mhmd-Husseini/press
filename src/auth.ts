import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  debug: true,
  trustHost: true, // Trust the host header
  pages: {
    signIn: '/admin/login',
    error: '/api/auth/error',
  },
  useSecureCookies: false, // For HTTP in development/testing
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false // Set to true in production with HTTPS
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    }
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const parsedCredentials = z
            .object({ 
              email: z.string().email(),
              password: z.string().min(6) 
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            return null;
          }

          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({
            where: { email },
            include: { roles: true }
          });
          
          if (!user) {
            return null;
          }
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          
          if (!passwordsMatch) {
            return null;
          }

          const { password: _, ...userWithoutPass } = user;
          return userWithoutPass;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ]
}); 