import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register']
// /api/cron is protected by its own CRON_SECRET bearer token, not a session
const authApiRoutes = ['/api/auth', '/api/cron']

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { id?: string } } | null }
  const isLoggedIn = !!session?.user?.id

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isAuthApiRoute = authApiRoutes.some((route) => nextUrl.pathname.startsWith(route))
  const isApiRoute = nextUrl.pathname.startsWith('/api/')
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/assets') ||
    nextUrl.pathname.startsWith('/analytics') ||
    nextUrl.pathname.startsWith('/import') ||
    nextUrl.pathname.startsWith('/settings')

  // Allow auth API routes always
  if (isAuthApiRoute) {
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute) {
    // If already logged in and trying to access login/register, redirect to dashboard
    if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Protect dashboard and private API routes
  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (isDashboardRoute) {
      const loginUrl = new URL('/login', nextUrl)
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
