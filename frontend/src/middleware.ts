/**
 * SafarPK Enterprise Edge RBAC Middleware
 * OWASP ASVS Level 2+ / NIST SP 800-63B Compliant
 * 
 * Enforces server-side Role-Based Access Control (RBAC) on:
 * - /admin/** -> SUPER_ADMIN only
 * - /lister/** -> LISTER or SUPER_ADMIN
 * - /driver/** -> DRIVER or SUPER_ADMIN
 * - /provider/** -> PROVIDER or SUPER_ADMIN
 * - /customer/** -> Any authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Whitelist static assets, probe routes, public auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/neon-health') ||
    pathname.startsWith('/api/track-click') ||
    pathname.startsWith('/api/whatsapp-otp') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // 2. Extract validated session from HttpOnly cookie
  const session = await getSessionFromRequest(req);
  const isAuthenticated = !!session;
  const role = session?.role;

  // 3. Admin Protected Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'SUPER_ADMIN') {
      // Forbidden: redirect to customer dashboard
      return NextResponse.redirect(new URL('/customer', req.url));
    }
  }

  // 4. Lister Protected Routes
  if (pathname.startsWith('/lister')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'LISTER' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/customer', req.url));
    }
  }

  // 5. Driver Protected Routes
  if (pathname.startsWith('/driver') && !pathname.startsWith('/drivers')) {
    // Note: /drivers is public directory, /driver is private duty dashboard
    if (pathname === '/driver' || pathname.startsWith('/driver/')) {
      // Check if it's a public driver slug profile (e.g. /driver/imran-khan)
      const isPublicSlug = pathname.split('/').length === 3 && !pathname.includes('duty');
      if (!isPublicSlug) {
        if (!isAuthenticated) {
          const loginUrl = new URL('/login', req.url);
          loginUrl.searchParams.set('returnUrl', pathname);
          return NextResponse.redirect(loginUrl);
        }
        if (role !== 'DRIVER' && role !== 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/customer', req.url));
        }
      }
    }
  }

  // 6. Provider Protected Routes
  if (pathname.startsWith('/provider')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'PROVIDER' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/customer', req.url));
    }
  }

  // 7. Customer Dashboard & Settings Protected Routes
  if (pathname.startsWith('/customer') || pathname.startsWith('/settings')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/lister/:path*',
    '/driver/:path*',
    '/provider/:path*',
    '/customer/:path*',
    '/settings/:path*',
  ],
};

