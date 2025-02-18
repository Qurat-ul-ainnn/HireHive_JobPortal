import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request: NextRequest) {
  // Check if the request is for the login page
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  // For API routes, skip the middleware
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get the token from the cookies
  const token = request.cookies.get('token')?.value;

  // If there's no token and the user is not on the login page, redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there's a token and the user is on the login page, redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based route protection
  if (token) {
    try {
      const decoded = jwtDecode(token) as { role: string };
      
      // Protect vendor routes
      if (request.nextUrl.pathname.startsWith('/dashboard/vendor') && decoded.role !== 'vendor') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Protect job seeker routes
      if (request.nextUrl.pathname.startsWith('/dashboard/jobseeker') && decoded.role !== 'job_seeker') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Protect admin routes
      if (request.nextUrl.pathname.startsWith('/dashboard/admin') && decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 