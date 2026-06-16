'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'

export default function JoinGroupModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to join group')
        return
      }
      router.push(`/groups/${(data.group as { id: string }).id}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const close = () => {
    setOpen(false)
    setCode('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-surface-container/60 backdrop-blur border border-white/20 text-on-surface font-label uppercase tracking-widest text-sm font-bold px-5 py-2.5 rounded hover:bg-white/10 transition-all active:scale-95"
      >
        Join Group
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative bg-surface-container border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-cream mb-1">Join a Group</h2>
            <p className="text-on-surface-variant text-sm mb-5">
              Enter an invite code to join a group watchlist.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm text-on-surface-variant mb-1.5">
                  Invite code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="e.g. ABCD1234"
                  autoFocus
                  required
                  className="w-full bg-surface-container-high border border-white/10 rounded-lg px-4 py-2.5 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-ember/60 transition-colors font-mono tracking-widest uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={!code.trim() || loading}
                className="w-full bg-ember text-black font-label uppercase tracking-widest text-sm font-bold py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining…' : 'Join Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
