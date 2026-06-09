'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// ─── Styles ──────────────────────────────────────────────────────────────────

const input =
  'w-full bg-surface-container-high border border-outline-variant rounded-md px-4 py-3 ' +
  'text-on-surface placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const supabase = createClient()

  // Exchange the PKCE code (or implicit token) for a valid session on mount.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setInitError('Invalid or expired reset link. Please request a new one.')
        else setReady(true)
      })
      return
    }

    // Fallback: if no code param, check whether the auth state change event
    // fires (implicit flow with hash token handled by the SDK automatically).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // If neither code nor hash, the link is invalid.
    const hasHash = typeof window !== 'undefined' && window.location.hash.includes('access_token')
    if (!hasHash) setInitError('No reset code found. Please request a new password reset.')

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { setServerError(error.message); return }
    router.push('/sign-in?message=password-updated')
  }

  const errors = form.formState.errors

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-8">

        <div className="mb-8">
          <p className="font-display text-2xl text-gold mb-1">PictureBox</p>
          <h1 className="text-xl font-semibold text-on-surface mb-1">Choose a new password</h1>
          <p className="text-on-surface-variant text-sm">Make it strong.</p>
        </div>

        {initError ? (
          <div className="space-y-4">
            <div className="bg-error/10 border border-error/30 rounded-md px-4 py-3 text-error text-sm">
              {initError}
            </div>
            <Link
              href="/forgot-password"
              className="block text-center text-sm text-gold hover:text-gold/80 transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        ) : !ready ? (
          // Verifying reset code…
          <div className="flex items-center justify-center py-8 gap-3 text-on-surface-variant text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying reset link…
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* New password */}
            <div>
              <label htmlFor="password" className="block text-sm text-on-surface-variant mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('password')}
                  className={cn(input, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-on-surface-variant mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register('confirmPassword')}
                  className={cn(input, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-error text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-error/10 border border-error/30 rounded-md px-4 py-3 text-error text-sm">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-gold text-black font-label uppercase font-bold py-3 rounded-md hover:bg-gold-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
