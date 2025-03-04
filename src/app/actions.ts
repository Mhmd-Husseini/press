'use server';

import { cookies } from 'next/headers';

export async function setLanguage(locale: 'en' | 'ar') {
  // Set a cookie to remember the language preference
  cookies().set('NEXT_LOCALE', locale);
  
  // Return success instead of redirecting
  return { success: true };
} 