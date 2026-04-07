import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authToken = request.cookies.get('authToken')?.value;
    const isLoggedIn = Boolean(authToken);

    // Rule 1: /admin/* without token → redirect to /login
    if (pathname.startsWith('/admin') && !isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname); // preserve intended destination
        return NextResponse.redirect(loginUrl);
    }

    // Rule 2: /login with token → redirect to /admin
    if (pathname === '/login' && isLoggedIn) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

// Only run middleware on these routes
export const config = {
    matcher: ['/admin/:path*', '/login'],
};
