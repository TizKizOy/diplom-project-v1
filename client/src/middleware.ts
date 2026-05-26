import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  const protectedPrefixes = [
    '/main',
    '/account',
    '/courses',
    '/admin',
    '/messages',
    '/notifications',
    '/certificates',
    '/help',
  ];
  const isProtectedRoute = protectedPrefixes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
