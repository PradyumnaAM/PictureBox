'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateGroupModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create group')
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
    setName('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-ember text-black font-label uppercase tracking-widest text-sm font-bold px-5 py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all"
      >
        Create Group
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative w-full max-w-md rounded-lg border border-ember/25 bg-surface-container p-6 shadow-header">
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-cream mb-1">Create a Group</h2>
            <p className="text-on-surface-variant text-sm mb-5">
              Create a shared watchlist with friends.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="group-name" className="block text-sm text-on-surface-variant mb-1.5">
                  Group name
                </label>
                <input
                  id="group-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. Friday Film Club"
                  autoFocus
                  required
                  className="w-full bg-surface-container-high border border-white/10 rounded-lg px-4 py-2.5 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-ember/60 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="w-full bg-ember text-black font-label uppercase tracking-widest text-sm font-bold py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating…' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
