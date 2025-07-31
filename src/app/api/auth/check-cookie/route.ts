import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    return NextResponse.json({
      hasCookie: !!authToken,
      cookieValue: authToken?.value ? 'Present' : 'Missing',
      allCookies: Object.fromEntries(
        cookieStore.getAll().map(cookie => [cookie.name, cookie.value ? 'Present' : 'Missing'])
      )
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check cookies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}