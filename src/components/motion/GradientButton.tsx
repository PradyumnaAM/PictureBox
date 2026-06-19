'use client'

import Link from 'next/link'
import { type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface BaseProps {
  children: ReactNode
  className?: string
  /** Pill size. */
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'px-6 py-2.5 text-xs',
  md: 'px-8 py-3 text-sm sm:px-10 sm:py-3.5',
  lg: 'px-8 py-3.5 text-sm sm:px-10 md:px-12 md:py-4 md:text-base',
} as const

/**
 * Velvet Cinema gradient pill — the headline CTA. A deep burnt-wood → amber
 * sweep with an inset highlight and a hairline warm ring.
 * Renders as a Link when `href` is set, else a button.
 */
const GRADIENT_CLASSES =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold uppercase tracking-widest text-white transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none'

const GRADIENT_STYLE = {
  backgroundImage:
    'linear-gradient(123deg, #2a1400 4%, #7a3d00 34%, #c8870a 66%, #e09c18 100%)',
  boxShadow:
    '0 4px 12px rgba(200, 135, 10, 0.35), 4px 4px 12px #7a3d00 inset, 0 0 0 2px rgba(255,255,255,0.85)',
  outlineOffset: '-3px',
}

type LinkButtonProps = BaseProps &
  ({ href: string } & Omit<ComponentProps<typeof Link>, 'href' | 'className'>)
type NativeButtonProps = BaseProps &
  ({ href?: undefined } & Omit<ComponentProps<'button'>, 'className'>)

export default function GradientButton(props: LinkButtonProps | NativeButtonProps) {
  const { children, className, size = 'md', ...rest } = props
  const classes = cn(GRADIENT_CLASSES, SIZES[size], className)

  if ('href' in rest && rest.href) {
    return (
      <Link className={classes} style={GRADIENT_STYLE} {...rest} href={rest.href}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} style={GRADIENT_STYLE} {...(rest as ComponentProps<'button'>)}>
      {children}
    </button>
  )
}
