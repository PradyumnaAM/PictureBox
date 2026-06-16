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
  'w-full bg-surface-container-high border border-outline-variant rounded-md px-4 py-3 ' +
  'text-on-surface placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/reset-password',
    })
    if (error) { setServerError(error.message); return }
    setSent(true)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-8">

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
              <h1 className="font-display text-[1.75rem] font-semibold text-cream mb-1.5">Reset your password</h1>
              <p className="text-on-surface-variant text-sm">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
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

              {serverError && (
                <div className="bg-error/10 border border-error/30 rounded-md px-4 py-3 text-error text-sm">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full bg-ember text-black font-label uppercase font-bold py-3 rounded-md hover:bg-ember-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
