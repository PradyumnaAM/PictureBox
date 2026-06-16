'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'

export default function DangerZone() {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/user/export')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error((data as { error?: string }).error ?? 'Failed to export data.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'picturebox-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Your data is downloading.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    const input = window.prompt(
      'This will permanently delete your account.\n\nType DELETE to confirm:',
    )
    if (input !== 'DELETE') return

    setDeleting(true)
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error((data as { error?: string }).error ?? 'Failed to delete account.')
        return
      }

      // Invalidate browser-side session
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      await supabase.auth.signOut()

      router.push('/')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-surface-container/60 backdrop-blur border border-red-500/20 rounded-xl p-6 mb-6">
      <h2 className="font-display text-xl text-red-400 mb-4">Danger Zone</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-on-surface font-medium">Export my data</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Download a JSON copy of your watch history, ratings, and reviews.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex-shrink-0 border border-white/20 text-on-surface text-sm font-medium px-4 py-2 rounded-lg hover:border-white/40 hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export data'}
          </button>
        </div>

        <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-on-surface font-medium">Delete account</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-shrink-0 bg-red-500/10 border border-red-500/40 text-red-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-500/20 hover:border-red-500/60 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  )
}
