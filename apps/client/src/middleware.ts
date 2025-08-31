import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  // Public routes (like auth pages)
  if (pathname.startsWith('/auth') || pathname === '/') {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    // Verify JWT with secret
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    const role = payload.role as string;

    // Admin-only routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/protected/dashboard', req.url));
    }

    // Protected user routes
    if (pathname.startsWith('/protected') && !role) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('JWT verification failed', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

// Apply middleware only to relevant paths
export const config = {
  matcher: ['/protected/:path*', '/admin/:path*'],
};
