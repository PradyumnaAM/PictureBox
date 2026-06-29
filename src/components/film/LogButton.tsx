'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'

import LogModal, { type ExistingLog } from './LogModal'

interface MovieMeta {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

interface LogButtonProps {
  movie: MovieMeta
  label?: string
  /** 'solid' = primary ember button; 'outline' = lighter frosted button. */
  variant?: 'solid' | 'outline'
  /** Existing shared title row, so the log attaches to the right title. */
  titleId?: string | null
  /** The viewer's current log for this title — prefills the modal for editing. */
  existingLog?: ExistingLog | null
}

const SOLID =
  'bg-ember text-black font-label uppercase tracking-widest font-bold px-6 py-3 rounded ' +
  'flex items-center gap-2 hover:bg-ember-hover active:scale-95 transition-all ' +
  'shadow-[0_4px_14px_0_rgba(255,77,46,0.39)]'

const OUTLINE =
  'surface-frost flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 ' +
  'font-sans text-sm font-semibold text-cream transition-all hover:border-ember hover:text-ember active:scale-95'

export default function LogButton({
  movie,
  label = 'LOG THIS FILM',
  variant = 'solid',
  titleId = null,
  existingLog = null,
}: LogButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={variant === 'outline' ? OUTLINE : SOLID}
      >
        <Pencil className="w-4 h-4" />
        {label}
      </button>
      <LogModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        movie={movie}
        titleId={titleId}
        existingLog={existingLog}
      />
    </>
  )
}
