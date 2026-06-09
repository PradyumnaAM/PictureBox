'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Schema ──────────────────────────────────────────────────────────────────

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores'),
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

type FormData = z.infer<typeof signUpSchema>
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

// ─── Styles ──────────────────────────────────────────────────────────────────

const input =
  'w-full bg-surface-container-high border border-outline-variant rounded-md px-4 py-3 ' +
  'text-on-surface placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', username: '', password: '', confirmPassword: '' },
  })

  const watchedUsername = form.watch('username')

  // ── Debounced username availability check ──────────────────────────────────
  const checkUsername = useCallback((username: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!username || username.length < 3 || !/^[A-Za-z0-9_]+$/.test(username)) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(username)}`,
        )
        if (!res.ok) { setUsernameStatus('idle'); return }
        const json: { available: boolean } = await res.json()
        setUsernameStatus(json.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
  }, [])

  useEffect(() => {
    checkUsername(watchedUsername)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [watchedUsername, checkUsername])

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { username: data.username } },
    })
    if (error) { setServerError(error.message); return }
    router.push('/onboarding')
  }

  const errors = form.formState.errors

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="font-display text-2xl text-gold mb-1">PictureBox</p>
          <h1 className="text-xl font-semibold text-on-surface mb-1">Create your account</h1>
          <p className="text-on-surface-variant text-sm">Join the discerning curators.</p>
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

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm text-on-surface-variant mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="yourname"
                {...form.register('username')}
                className={cn(input, 'pr-10')}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {usernameStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 text-on-surface-variant animate-spin" />
                )}
                {usernameStatus === 'available' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {usernameStatus === 'taken' && (
                  <X className="w-4 h-4 text-error" />
                )}
              </div>
            </div>
            {errors.username ? (
              <p className="text-error text-sm mt-1">{errors.username.message}</p>
            ) : usernameStatus === 'taken' ? (
              <p className="text-error text-sm mt-1">This username is already taken</p>
            ) : usernameStatus === 'available' ? (
              <p className="text-green-500 text-sm mt-1">Username is available</p>
            ) : null}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm text-on-surface-variant mb-1.5">
              Password
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
              Confirm password
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
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-gold hover:text-gold/80 transition-colors">
              Sign in
            </Link>
          </p>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-container/60 px-3 text-on-surface-variant">or</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-on-surface-variant">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-on-surface transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-on-surface transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
