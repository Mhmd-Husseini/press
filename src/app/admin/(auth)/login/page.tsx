'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
    >
      {pending ? 'Logging in...' : 'Login'}
    </button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  async function handleLogin(formData: FormData) {
    setError(null);
    
    const result = await login(formData);
    
    if (!result.success) {
      setError(typeof result.error === 'string' 
        ? result.error 
        : 'Login failed. Please check your credentials.');
      return;
    }
    
    // Redirect to dashboard or home page on successful login
    router.push('/dashboard');
  }
  
  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      
      <form action={handleLogin}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <SubmitButton />
      </form>
      
      <div className="text-center mt-4">
        <a href="/register" className="text-blue-600 hover:text-blue-800">
          Don't have an account? Register
        </a>
      </div>
    </div>
  );
} 