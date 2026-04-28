import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  const publicRoutes = ['/', '/auth'];
  const protectedRoutes = ['/main', '/account', '/courses', '/admin'];

  if (publicRoutes.includes(pathname) && accessToken) {
    return NextResponse.redirect(new URL('/main', request.url));
  }

  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) &&
    !accessToken
  ) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
