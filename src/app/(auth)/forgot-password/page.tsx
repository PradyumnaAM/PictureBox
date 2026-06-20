'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

// ─── Styles ──────────────────────────────────────────────────────────────────

const input =
  'w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 ' +
  'text-on-surface placeholder:text-outline ' +
  'focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/20 transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    // Send the link through the server-side /auth/callback route, which
    // exchanges the PKCE code and sets the session cookie before redirecting
    // to /reset-password. Use the live origin so the link points back to the
    // environment the request came from (dev or prod), not a hardcoded host.
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    if (error) console.error('[forgot-password]', error.message)
    setSent(true)
  }

  return (
    <div className="w-full max-w-md">
      <div className="surface-frost rounded-2xl border border-white/10 p-8 shadow-header">

        {sent ? (
          // ── Success state ──────────────────────────────────────────────────
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-ember-muted flex items-center justify-center mx-auto mb-2">
              <Mail className="w-6 h-6 text-ember" />
            </div>
            <h1 className="text-xl font-semibold text-on-surface">Check your email</h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              We sent a password reset link to{' '}
              <span className="text-on-surface font-medium">{form.getValues('email')}</span>.
              It expires in 24 hours.
            </p>
            <p className="text-xs text-on-surface-variant">
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <Link
              href="/sign-in"
              className="inline-block mt-2 text-sm text-ember hover:text-ember/80 transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          // ── Form state ─────────────────────────────────────────────────────
          <>
            <div className="mb-8">
              <p className="font-label text-label uppercase text-ember mb-3">Members Only</p>
              <h1 className="text-iris-gradient font-display text-[1.75rem] font-semibold tracking-tight mb-1.5">Reset your password</h1>
              <p className="text-on-surface-variant text-sm">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} method="post" noValidate className="space-y-5">
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
                {form.formState.errors.email && (
                  <p className="text-error text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="btn-iris-gradient flex w-full items-center justify-center gap-2 rounded-full py-3 font-sans text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-on-surface-variant">
              <Link href="/sign-in" className="text-ember hover:text-ember/80 transition-colors">
                ← Back to sign in
              </Link>
            </p>
          </>
        )}

      </div>
    </div>
  )
}
