import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Public routes that don't need client info
    const publicRoutes = ['/', '/login', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

    // Protected routes that require client info
    const protectedRoutes = ['/assessment', '/dashboard', '/submission', '/admin', '/welcome']
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

    // Protected routes check removed as we move to Supabase Auth
    // The previous simple cookie check is no longer valid with the new signup flow.
    // Real auth protection is now handled by RLS and client-side session checks.

    // Allow access
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
