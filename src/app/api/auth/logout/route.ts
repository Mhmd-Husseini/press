import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

const authService = new AuthService();

// POST /api/auth/logout - Log out the current user
export async function POST(request: NextRequest) {
  try {
    await authService.clearAuthCookie();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    );
  }
} 