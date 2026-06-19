import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase auth callback handler.
 *
 * Supabase appends ?code=<PKCE_code> to the redirect URL for:
 *   - Email confirmation links (signup)
 *   - Password reset links (forgot-password)
 *   - OAuth logins (if added later)
 *
 * This route exchanges the code for a session, writes the session cookies,
 * and redirects the user to the appropriate destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type') // 'recovery' for password reset

  if (!code) {
    // No code present — redirect to sign-in with an error hint
    return NextResponse.redirect(
      new URL('/sign-in?error=missing_code', origin),
    )
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Code invalid or expired — send user to an error-aware page
    const errorUrl = new URL('/sign-in', origin)
    errorUrl.searchParams.set('error', 'auth_callback_failed')
    return NextResponse.redirect(errorUrl)
  }

  // Password-reset flow: redirect to the reset-password page.
  // The session from the code exchange is already in the cookies.
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password', origin))
  }

  // Email confirmation: redirect to the `next` param (default: /feed)
  // Guard against open-redirect: only allow relative paths.
  const safeNext =
    next.startsWith('/') && !next.startsWith('//') ? next : '/feed'

  return NextResponse.redirect(new URL(safeNext, origin))
}
