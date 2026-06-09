'use client'

import { usePathname } from 'next/navigation'

import Navbar from './Navbar'

const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/onboarding']

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default function NavbarWrapper() {
  const pathname = usePathname()
  if (isAuthPath(pathname)) return null
  return <Navbar activePath={pathname} />
}
