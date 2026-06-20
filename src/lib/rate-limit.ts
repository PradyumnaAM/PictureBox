import { type NextRequest } from 'next/server'

interface Entry { count: number; resetAt: number }

export interface RateLimiterOptions {
  max: number
  windowMs: number
}

export function createRateLimiter({ max, windowMs }: RateLimiterOptions) {
  const store = new Map<string, Entry>()

  return function check(ip: string): boolean {
    const now = Date.now()
    const entry = store.get(ip)
    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      return true
    }
    if (entry.count >= max) return false
    entry.count++
    return true
  }
}

export function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
