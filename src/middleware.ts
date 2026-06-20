import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/supabase'
import { REMEMBER_PREF_COOKIE, SESSION_ALIVE_COOKIE } from '@/lib/auth/remember'

/**
 * Routes that require an authenticated session. A request to any of these
 * (or a sub-path) with no session is redirected to /sign-in.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/feed',
  '/watchlist',
  '/diary',
  '/log',
  '/groups',
  '/settings',
  '/profile/edit',
  '/onboarding',
]

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export async function middleware(request: NextRequest) {
  // This response is mutated by Supabase's cookie helpers so the refreshed
  // session is written back to the browser on every request.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: refreshes the auth token. Do not run code between creating the
  // client and this call, and always use getUser() (not getSession()) here —
  // getUser() revalidates the token with the Supabase auth server.
  let {
    data: { user },
  } = await supabase.auth.getUser()

  // "Remember me" enforcement. Supabase always writes persistent auth cookies,
  // so a user who opted out of being remembered (pb-remember='0') would stay
  // logged in across browser restarts. The pb-alive session cookie disappears
  // when the browser closes; if it's gone for an opted-out user, end the
  // session by expiring the Supabase auth cookies.
  const rememberPref = request.cookies.get(REMEMBER_PREF_COOKIE)?.value
  const browserAlive = request.cookies.get(SESSION_ALIVE_COOKIE)?.value
  if (user && rememberPref === '0' && !browserAlive) {
    for (const { name } of request.cookies.getAll()) {
      if (name.startsWith('sb-')) {
        supabaseResponse.cookies.set(name, '', { maxAge: 0, path: '/' })
      }
    }
    supabaseResponse.cookies.set(REMEMBER_PREF_COOKIE, '', { maxAge: 0, path: '/' })
    user = null
  }

  if (!user && isProtected(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Carry over any cookies we set above (e.g. expired session cookies for an
    // un-remembered user) so the deletions aren't dropped by the new response.
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie)
    }
    return redirectResponse
  }

  // IMPORTANT: return the supabaseResponse object as-is so refreshed cookies
  // are not dropped. If you build a new response, copy over its cookies.
  return supabaseResponse
}

export const config = {
  /*
   * Run on all request paths except:
   * - _next/static (static files)
   * - _next/image (image optimization)
   * - favicon.ico, and common static image assets
   * Public routes (/, /sign-in, /sign-up, /tv/*, /u/*, /legal/*) still
   * pass through so the session can be refreshed; they just aren't gated above.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
