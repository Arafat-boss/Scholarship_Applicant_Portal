import { NextResponse } from 'next/server';
import { getAuthCookieOptions } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * ----------------------------------------------------------------------------
 * Session logout endpoint:
 * - Clears the HttpOnly session cookie by setting Max-Age to 0
 * - Invalidates client session and revokes dashboard access
 */
export async function POST() {
  try {
    const cookieOptions = getAuthCookieOptions(true); // true = logout mode (maxAge: 0)
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set({
      name: cookieOptions.name,
      value: '',
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process logout request.' },
      { status: 500 }
    );
  }
}
