import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  const isAdminRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/members') ||
    request.nextUrl.pathname.startsWith('/events') ||
    request.nextUrl.pathname.startsWith('/branches') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/users')

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Inactivity timeout: sign out and redirect if idle for more than 30 minutes
  if (isAdminRoute && user) {
    const lastActivityCookie = request.cookies.get('last_activity')
    const now = Date.now()

    // Determine whether the session should be expired:
    // - Cookie is absent means either it was never set (shouldn't happen after fixing login)
    //   or its maxAge elapsed (i.e. 30+ minutes of inactivity)
    // - Cookie exists but timestamp is stale (belt-and-suspenders check)
    const isExpired =
      !lastActivityCookie ||
      (() => {
        const last = parseInt(lastActivityCookie.value, 10)
        return isNaN(last) || now - last > INACTIVITY_TIMEOUT_MS
      })()

    if (isExpired) {
      // Sign out server-side — this writes cookie deletions into supabaseResponse
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('reason', 'inactivity')
      const redirectResponse = NextResponse.redirect(url)
      // Propagate Supabase auth-token cookie deletions from signOut into the
      // redirect response so the browser actually clears the session
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      redirectResponse.cookies.delete('last_activity')
      return redirectResponse
    }

    // Session is still active — refresh the activity timestamp
    supabaseResponse.cookies.set('last_activity', String(now), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: INACTIVITY_TIMEOUT_MS / 1000,
      path: '/',
    })
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
