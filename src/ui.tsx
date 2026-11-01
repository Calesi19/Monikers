import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ROUND_RULES, type GameState, type TeamIdx } from './game/engine'

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

type BtnVariant =
  | 'primary'
  | 'paper'
  | 'teama'
  | 'teamb'
  | 'start'
  | 'pass'
  | 'got'

export function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  className,
  ...rest
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  size?: 'lg' | 'sm'
  disabled?: boolean
  className?: string
  'aria-label'?: string
  autoFocus?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', className)}
      {...rest}
    >
      {children}
    </button>
  )
}

/** The two teams are fixed colors — no names, no sign-ups. */
export const TEAM_META: { label: string }[] = [{ label: 'Blue' }, { label: 'Gold' }]

export function TeamChip({ team }: { team: TeamIdx }) {
  return (
    <span className={cn('chip', team === 0 ? 'chip--a' : 'chip--b')}>
      {TEAM_META[team].label} team
    </span>
  )
}

export function ScoreBug({ totals }: { totals: [number, number] }) {
  return (
    <div className="scorebug" role="group" aria-label={`Score: Blue ${totals[0]}, Gold ${totals[1]}`}>
      <span className="scorebug__team scorebug__team--a">
        Blue <b>{totals[0]}</b>
      </span>
      <span className="scorebug__vs" aria-hidden="true">
        VS
      </span>
      <span className="scorebug__team scorebug__team--b">
        Gold <b>{totals[1]}</b>
      </span>
    </div>
  )
}

/** The three pressings. Same deck, less ink every round. */
export const PRESSINGS: { name: string; banner: string }[] = [
  { name: 'The Zine', banner: 'ROUND 01 // ANYTHING GOES — DESCRIBE IT HOWEVER YOU WANT' },
  { name: 'Xerox Two-Tone', banner: 'ROUND 02 // STRICTLY ONE WORD ONLY' },
  { name: 'Bootleg Blackout', banner: 'ROUND 03 // SILENT PANTOMIME — MICS OFF, CHARADES ONLY' },
]

export function RuleBanner({ round }: { round: number }) {
  const r = Math.min(2, Math.max(0, round))
  return (
    <p className={cn('banner', `banner--r${r + 1}`, r === 0 && 'tape')}>
      {PRESSINGS[r].banner}
    </p>
  )
}

export function SectionHead({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div className="section-head">
      <h2 id={id}>{children}</h2>
      <span className="rule" aria-hidden="true" />
    </div>
  )
}

const pad2 = (n: number) => String(n).padStart(2, '0')
export { pad2 }

/** Gig setlist: numbered rows, dotted leaders, round-by-round badges. */
export function Setlist({
  state,
  title,
  roundsShown,
  note,
}: {
  state: GameState
  title: string
  roundsShown: number
  note?: ReactNode
}) {
  const rounds = state.scores.slice(0, roundsShown)
  const totals: [number, number] = [
    rounds.reduce((s, r) => s + r[0], 0),
    rounds.reduce((s, r) => s + r[1], 0),
  ]
  const order: TeamIdx[] = totals[1] > totals[0] ? [1, 0] : [0, 1]
  return (
    <section className="paper setlist" aria-label={title}>
      <div className="setlist__title">
        <h2>{title}</h2>
        <span className="meta">
          {pad2(roundsShown)}/03 rounds
        </span>
      </div>
      <ol>
        {order.map((t, i) => (
          <li key={t}>
            <span className="setlist__n">{pad2(i + 1)}.</span>
            <span className="setlist__team">
              <span
                className="setlist__swatch"
                style={{ background: t === 0 ? 'var(--team-a)' : 'var(--team-b)' }}
                aria-hidden="true"
              />
              {TEAM_META[t].label}
            </span>
            <span className="setlist__dots" aria-hidden="true" />
            <span className="setlist__pts">
              {totals[t]}
              <span className="sr-only"> points</span>
            </span>
            <span className="setlist__badges">
              {state.scores.map((r, ri) => (
                <span
                  key={ri}
                  className={cn('badge', ri < roundsShown && 'badge--on')}
                >
                  R{pad2(ri + 1)} {ri < roundsShown ? r[t] : '--'}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>
      {note && <p className="setlist__note">{note}</p>}
    </section>
  )
}

export function HowToPlay({ label = 'How to play' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener.current?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="btn btn--paper"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <div className="dialog-scrim" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="htp-title"
            className="paper dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="meta muted">The rules, photocopied</p>
            <h2 id="htp-title" className="display misreg" style={{ marginTop: '0.25rem' }}>
              How to play
            </h2>
            <p>
              Two teams, one phone. On your turn the clock runs and you get your
              team to shout as many names as you can. Tap <b>Got it</b> when they
              say it; <b>Pass</b> sends the card to the bottom of the pile. Every
              guessed card is one point.
            </p>
            <p>The same deck comes back all three rounds, with fewer words each time:</p>
            <ol>
              {ROUND_RULES.map((r, i) => (
                <li key={r.title}>
                  <span className="badge badge--on">R{pad2(i + 1)}</span>
                  <span>
                    <b>{r.title}.</b> {r.rule}
                  </span>
                </li>
              ))}
            </ol>
            <p>
              Stuck on a name nobody at the table knows? The small <b>remove</b>{' '}
              link takes that card out of the game for good. Most points after
              round three wins.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <button
                ref={closeBtn}
                type="button"
                className="btn btn--primary"
                onClick={() => setOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
