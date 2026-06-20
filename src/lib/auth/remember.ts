/**
 * "Remember me" support.
 *
 * @supabase/ssr always writes its auth cookies as persistent (~400 day) cookies
 * — the maxAge passed via cookieOptions is overridden internally — so we can't
 * make the session session-scoped through Supabase directly. Instead we keep two
 * small marker cookies that WE control:
 *
 *   - pb-remember : the user's preference ('1' = remember, '0' = don't).
 *                   Always persistent so it survives a browser restart and tells
 *                   us, on the next visit, what the user originally chose.
 *   - pb-alive    : a plain session cookie (no max-age) the browser deletes when
 *                   it fully closes. Its presence means "browser still open".
 *
 * Middleware (see src/middleware.ts) ends the session when a user opted out of
 * being remembered (pb-remember='0') and the browser has since closed (pb-alive
 * gone). When pb-remember is absent we default to keeping the session, so other
 * sign-in paths (OAuth, email confirmation) stay logged in.
 */

export const REMEMBER_PREF_COOKIE = 'pb-remember'
export const SESSION_ALIVE_COOKIE = 'pb-alive'

// Match Supabase's own 400-day cookie lifetime for the persistent markers.
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60

/**
 * Record the user's choice after a successful sign-in. Browser-only (writes via
 * document.cookie).
 */
export function persistRememberChoice(remember: boolean): void {
  if (typeof document === 'undefined') return
  const secure = location.protocol === 'https:' ? '; Secure' : ''

  document.cookie =
    `${REMEMBER_PREF_COOKIE}=${remember ? '1' : '0'}; path=/; ` +
    `max-age=${REMEMBER_MAX_AGE}; SameSite=Lax${secure}`

  // pb-alive is set as a session cookie regardless. When remembered, the
  // pb-remember='1' preference keeps the session alive even after it's gone;
  // when not remembered, its disappearance on browser close ends the session.
  document.cookie = `${SESSION_ALIVE_COOKIE}=1; path=/; SameSite=Lax${secure}`
}

/**
 * Clear the markers on sign-out so a later login starts from a clean slate.
 * Browser-only.
 */
export function clearRememberChoice(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${REMEMBER_PREF_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  document.cookie = `${SESSION_ALIVE_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
