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

// ─── Styles ──────────────────────────────────────────────────────────────────

const input =
  'w-full bg-surface-container-high border border-outline-variant rounded-md px-4 py-3 ' +
  'text-on-surface placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [redirectTo, setRedirectTo] = useState('/feed')

  // Read ?redirect= without useSearchParams (avoids Suspense requirement)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setRedirectTo(p.get('redirect') ?? '/feed')
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
    router.push(redirectTo)
  }

  const errors = form.formState.errors

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="font-display text-2xl text-gold mb-1">PictureBox</p>
          <h1 className="text-xl font-semibold text-on-surface mb-1">Welcome back.</h1>
          <p className="text-on-surface-variant text-sm">Sign in to continue.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">

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
                className="text-xs text-on-surface-variant hover:text-gold transition-colors"
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
            className="w-full bg-gold text-black font-label uppercase font-bold py-3 rounded-md hover:bg-gold-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <Link href="/sign-up" className="text-gold hover:text-gold/80 transition-colors">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}
