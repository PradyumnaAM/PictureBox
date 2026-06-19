'use client'

import Image from 'next/image'
import { Check, Clock3, Play, Star, Users } from 'lucide-react'

import { ContainerScroll } from '@/components/ui/container-scroll-animation'

const poster = (path: string) => `https://image.tmdb.org/t/p/w342${path}`

const heroPoster = poster('/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg')

const queue = [
  { title: 'Severance', meta: 'S2 E08 next', img: '/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg' },
  { title: 'Past Lives', meta: 'Maya rated 4.5', img: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg' },
  { title: 'Heat', meta: 'Group pick', img: '/e09dLw1Ljtccd2P4NsuUvVtS5du.jpg' },
  { title: 'Andor', meta: 'Complete S2', img: '/khZqmwHQicTYoS7Flreb9EddFZC.jpg' },
]

const activity = [
  ['Maya', 'logged Past Lives', '4.5'],
  ['Jordan', 'finished Severance S2', '5.0'],
  ['Ren', 'voted Heat for Friday', '4 votes'],
]

function ScreenMock() {
  return (
    <div className="relative h-full overflow-hidden bg-[#070709] text-cream">
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex h-12 items-center justify-between border-b border-white/[0.07] bg-black/40 px-4 md:px-7">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold leading-none tracking-tight text-cream">PictureBox</span>
            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
          </div>
          <div className="hidden items-center gap-6 font-mono text-[10px] uppercase text-on-surface-variant md:flex">
            <span>Films</span>
            <span>TV</span>
            <span>Groups</span>
            <span>Diary</span>
          </div>
          <span className="font-mono text-[10px] uppercase text-ember">Live</span>
        </div>

        <div className="grid flex-1 grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative flex min-h-0 flex-col justify-end overflow-hidden border-b border-ember/15 md:border-b-0 md:border-r">
            <Image
              src={heroPoster}
              alt="Blade Runner 2049 poster"
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover opacity-35"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#070706] via-[#070706]/80 to-transparent" />

            <div className="relative p-5 md:p-8">
              <div className="mb-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase text-on-surface-variant">
                <span className="border border-ember/30 px-2 py-1 text-ember">Now tracking</span>
                <span className="border border-white/10 px-2 py-1">Film</span>
                <span className="border border-white/10 px-2 py-1">2017</span>
              </div>

              <h3 className="font-display text-4xl font-semibold leading-none tracking-tight md:text-6xl">
                Blade Runner 2049
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                One title page for watching, rating, reviewing, friends, and streaming availability.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-ember px-4 font-mono text-xs font-bold uppercase text-black">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Log watch
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-ember/30 px-4 font-mono text-xs font-bold uppercase text-cream">
                  <Users className="h-3.5 w-3.5" />
                  Add to group
                </button>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 grid-rows-[1fr_auto]">
            <div className="grid grid-cols-2 gap-3 overflow-hidden p-4 md:p-6">
              {queue.map((item, index) => (
                <div key={item.title} className="min-w-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-ember/20 bg-surface-container">
                    <Image
                      src={poster(item.img)}
                      alt={`${item.title} poster`}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                    <span className="absolute left-2 top-2 bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-ember">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-on-surface">{item.title}</p>
                  <p className="truncate text-xs text-on-surface-variant">{item.meta}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-ember/20 bg-black/45 p-4 md:p-6">
              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                {[
                  ['142', 'Films'],
                  ['688', 'Episodes'],
                  ['09', 'Groups'],
                ].map(([value, label]) => (
                  <div key={label} className="border border-white/10 bg-surface-container-low px-2 py-3">
                    <p className="font-display text-3xl font-bold leading-none text-ember">{value}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-on-surface-variant">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {activity.map(([name, line, score]) => (
                  <div key={line} className="flex items-center gap-3 border border-white/10 bg-surface-container-low/80 p-2.5">
                    <span className="flex h-7 w-7 items-center justify-center bg-ember font-mono text-xs font-bold text-black">
                      {name[0]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-on-surface-variant">
                      <strong className="text-on-surface">{name}</strong> {line}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ember">
                      {score.includes('.') ? <Star className="h-3 w-3 fill-current" /> : <Clock3 className="h-3 w-3" />}
                      {score}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase text-on-surface-variant">
                <Check className="h-3.5 w-3.5 text-ember" />
                TV progress, social reviews, and group watchlists share one timeline.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CinemaScrollShowcase() {
  return (
    <section className="relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="mx-auto max-w-4xl px-4 pt-10">
            <p className="mb-4 font-label text-label uppercase text-ember">
              Built for the whole watch habit
            </p>
            <h2 className="text-iris-gradient font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Your entire watch life, in a single&nbsp;continuous&nbsp;take.
            </h2>
          </div>
        }
      >
        <ScreenMock />
      </ContainerScroll>
    </section>
  )
}
