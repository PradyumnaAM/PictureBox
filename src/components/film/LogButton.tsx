'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'

import LogModal from './LogModal'

interface MovieMeta {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

interface LogButtonProps {
  movie: MovieMeta
  label?: string
}

export default function LogButton({ movie, label = 'LOG THIS FILM' }: LogButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-ember text-black font-label uppercase tracking-widest font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-ember-hover active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(255,77,46,0.39)]"
      >
        <Pencil className="w-4 h-4" />
        {label}
      </button>
      <LogModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        movie={movie}
        titleId={null}
        existingLog={null}
      />
    </>
  )
}
