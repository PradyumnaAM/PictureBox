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
      .min(12, 'Password must be at least 12 characters')
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
  'w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 ' +
  'text-on-surface placeholder:text-outline ' +
  'focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/20 transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const supabase = createClient()

  // The recovery link is processed by the server-side /auth/callback route,
  // which exchanges the PKCE code and sets the session cookie before redirecting
  // here. We simply confirm a recovery session exists. We also listen for auth
  // events to cover the implicit (hash token) flow, where the SDK establishes
  // the session client-side via detectSessionInUrl. Only after neither path
  // produces a session within a short grace window do we treat the link as bad.
  useEffect(() => {
    let settled = false
    const markReady = () => {
      if (settled) return
      settled = true
      setReady(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) markReady()
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady()
    })

    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      setInitError('Invalid or expired reset link. Please request a new one.')
    }, 2500)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
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
    router.refresh()
    router.push('/sign-in?message=password-updated')
  }

  const errors = form.formState.errors

  return (
    <div className="w-full max-w-md">
      <div className="surface-frost rounded-2xl border border-white/10 p-8 shadow-header">

        <div className="mb-8">
          <p className="font-label text-label uppercase text-ember mb-3">Members Only</p>
          <h1 className="text-iris-gradient font-display text-[1.75rem] font-semibold tracking-tight mb-1.5">Choose a new password</h1>
          <p className="text-on-surface-variant text-sm">Make it strong.</p>
        </div>

        {initError ? (
          <div className="space-y-4">
            <div className="bg-error/10 border border-error/30 rounded-md px-4 py-3 text-error text-sm">
              {initError}
            </div>
            <Link
              href="/forgot-password"
              className="block text-center text-sm text-ember hover:text-ember/80 transition-colors"
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
          <form onSubmit={form.handleSubmit(onSubmit)} method="post" noValidate className="space-y-5">

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
              className="btn-iris-gradient flex w-full items-center justify-center gap-2 rounded-full py-3 font-sans text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
