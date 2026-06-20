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

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof signInSchema>

// Only accept a same-origin RELATIVE path to prevent open redirects.
function safeRedirect(raw: string | null): string {
  if (!raw) return '/feed'
  // Must be a root-relative path; reject protocol-relative ('//', '/\') and any scheme/host.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/feed'
  if (raw.includes(':')) return '/feed'
  return raw
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const input =
  'w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 ' +
  'text-on-surface placeholder:text-outline ' +
  'focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/20 transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [redirectTo, setRedirectTo] = useState('/feed')

  // Read ?redirect= without useSearchParams (avoids Suspense requirement)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setRedirectTo(safeRedirect(p.get('redirect')))
  }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    // Never reveal which field is wrong
    if (error) { setServerError('Invalid email or password'); return }
    router.push(safeRedirect(redirectTo))
    router.refresh()
  }

  const errors = form.formState.errors

  return (
    <div className="w-full max-w-md">
      <div className="surface-frost rounded-2xl border border-white/10 p-8 shadow-header">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-3 font-label text-label uppercase text-ember">Members Only</p>
          <h1 className="text-iris-gradient mb-1.5 font-display text-[2rem] font-semibold leading-tight tracking-tight">Welcome back.</h1>
          <p className="text-sm text-on-surface-variant">Sign in to continue.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} method="post" noValidate className="space-y-5">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm text-on-surface-variant mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...form.register('email')}
              className={input}
            />
            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-sm text-on-surface-variant">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-on-surface-variant hover:text-ember transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-ember hover:text-ember/80 transition-colors">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}
