'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors"
    >
      {pending ? 'Logging in...' : 'Login'}
    </button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  
  async function handleLogin(formData: FormData) {
    setError(null);
    setDebug('');
    
    try {
      const result = await login(formData);
      
      if (!result.success) {
        setError(typeof result.error === 'string' 
          ? result.error 
          : 'Login failed. Please check your credentials.');
        return;
      }
      
      // Set user data directly in the context
      if (result.user) {
        setUser(result.user);
      }
      
      // Get callback URL from search params or default to /admin
      const callbackUrl = searchParams.get('callbackUrl');
      const redirectTo = callbackUrl ? decodeURIComponent(callbackUrl) : '/admin';
      
      setDebug(`Login successful! Redirecting to: ${redirectTo}`);
      
      // Add a small delay to see the debug message
      setTimeout(() => {
        // Redirect to the callback URL or admin dashboard
        router.push(redirectTo);
        router.refresh(); // Refresh to ensure server state is updated
      }, 1000);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={handleLogin}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {debug && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {debug}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>
          
          <div>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
} 