import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/supabase'

/**
 * Routes that require an authenticated session. A request to any of these
 * (or a sub-path) with no session is redirected to /sign-in.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/feed',
  '/watchlist',
  '/log',
  '/groups',
  '/settings',
  '/profile/edit',
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtected(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
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
   * Public routes (/, /sign-in, /sign-up, /film/*, /tv/*, /u/*, /legal/*) still
   * pass through so the session can be refreshed; they just aren't gated above.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
