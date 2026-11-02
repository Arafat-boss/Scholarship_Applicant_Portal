import { NextRequest, NextResponse } from 'next/server';
import {
  isValidPasscode,
  createSessionToken,
  getAuthCookieOptions,
} from '@/lib/auth';

/**
 * POST /api/auth/login
 * ----------------------------------------------------------------------------
 * Reviewer committee login handler:
 * - Accepts passcode in JSON body (never via URL query params)
 * - Sets a secure HttpOnly session cookie upon successful verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const passcode = body.passcode || '';

    // 1. Validate committee passcode
    if (!isValidPasscode(passcode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid passcode. Access restricted to authorized committee reviewers.',
        },
        { status: 401 }
      );
    }

    // 2. Generate signed session token
    const sessionToken = createSessionToken();
    const cookieOptions = getAuthCookieOptions(false);

    // 3. Set secure HttpOnly cookie on response
    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
    });

    response.cookies.set({
      name: cookieOptions.name,
      value: sessionToken,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server authentication error. Please try again.' },
      { status: 500 }
    );
  }
}
