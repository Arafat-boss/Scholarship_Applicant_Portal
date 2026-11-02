import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

// Ensure this route is always dynamically evaluated and never prerendered at build time
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify
 * ----------------------------------------------------------------------------
 * Session verification endpoint:
 * - Checks whether the client request includes a valid HttpOnly session cookie
 * - Used during page load to verify if the committee member is authenticated
 */
export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const isAuthenticated = verifySessionToken(sessionCookie);

    return NextResponse.json(
      {
        success: true,
        authenticated: isAuthenticated,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Verify API Error:', error);
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 200 }
    );
  }
}
