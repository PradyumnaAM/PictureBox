import { NextResponse } from 'next/server'

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://picturebox.app'}/sitemap.xml`,
  ].join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
