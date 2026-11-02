import { useState, type ReactNode } from 'react'
import { isCoop, totalScores, totalTurns, type GameState } from '../game/engine'
import { Btn, Setlist, TEAM_META, cn } from '../ui'
import { fitW } from './Play'

const BEST_KEY = 'monikers-pocket-coop-best-v1'

interface Best {
  turns: number
  /** deck order of the game that set it, so re-reading that game is not a "new" best */
  sig: string
  prev: number | null
}

/** Fewest turns for this deck size + clock, kept on this phone only. */
function recordBest(state: GameState): { best: number | null; isNew: boolean } {
  const key = `${state.deck.length + state.removed.length}x${state.turnSeconds}`
  const sig = state.deck.map((c) => c.name).join('|')
  const turns = totalTurns(state)
  try {
    const all = JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}') as Record<string, Best>
    const cur = all[key]
    if (cur && cur.sig === sig) return { best: cur.prev, isNew: true }
    if (!cur || turns < cur.turns) {
      all[key] = { turns, sig, prev: cur ? cur.turns : null }
      localStorage.setItem(BEST_KEY, JSON.stringify(all))
      return { best: cur ? cur.turns : null, isNew: true }
    }
    return { best: cur.turns, isNew: false }
  } catch {
    return { best: null, isNew: false }
  }
}

function CoopEnd({
  state,
  actions,
}: {
  state: GameState
  actions: ReactNode
}) {
  // Read and write the record once, when this screen first shows.
  const [rec] = useState(() => recordBest(state))
  const turns = totalTurns(state)
  return (
    <div className="screen">
      <article className="poster poster--end team-coop" style={{ ['--p-bg' as string]: 'var(--t-bg)', ['--p-fg' as string]: 'var(--t-fg)' }}>
        <span className="poster__dots" aria-hidden="true" />
        <p className="poster__kicker">
          {rec.isNew
            ? rec.best === null
              ? 'First run on this deck · new record'
              : `New best · beat ${rec.best} turns`
            : rec.best !== null
              ? `Best on this deck: ${rec.best} turns`
              : 'All three pressings sold out'}
        </p>
        <h1 className="poster__title" style={fitW('Clearedxin')}>
          Cleared{'\u00a0'}<span className="hi">in</span>
        </h1>
        <p className="big-score" style={{ marginTop: 'clamp(0.5rem, 1.6dvh, 1rem)', ...fitW(String(turns) + '000') }}>
          <span aria-hidden="true">{turns}</span>
          <span className="big-score__unit" aria-hidden="true">
            {turns === 1 ? 'turn' : 'turns'}
          </span>
          <span className="sr-only">
            {turns} {turns === 1 ? 'turn' : 'turns'}
          </span>
        </p>
      </article>
      <Setlist
        state={state}
        title="Setlist"
        roundsShown={3}
        note={
          state.removed.length > 0
            ? `Cut from the deck along the way: ${state.removed.join(', ')}.`
            : undefined
        }
      />
      {actions}
    </div>
  )
}

export function GameEnd({
  state,
  onPlayAgain,
  onSetup,
  onHome,
}: {
  state: GameState
  onPlayAgain: () => void
  onSetup: () => void
  onHome: () => void
}) {
  const actions = (
    <div className="btn-row">
      <Btn variant="primary" onClick={onPlayAgain}>
        Play again
      </Btn>
      <div className="btn-pair">
        <Btn variant="paper" onClick={onSetup}>
          Settings
        </Btn>
        <Btn variant="paper" onClick={onHome}>
          Home
        </Btn>
      </div>
    </div>
  )
  if (isCoop(state)) return <CoopEnd state={state} actions={actions} />
  const totals = totalScores(state)
  const winner =
    totals[0] === totals[1] ? null : totals[0] > totals[1] ? 0 : 1
  return (
    <div className="screen">
      <article
        className={cn('poster poster--end', winner === 0 && 'team-a', winner === 1 && 'team-b')}
        style={
          winner === null
            ? undefined
            : { ['--p-bg' as string]: 'var(--t-bg)', ['--p-fg' as string]: 'var(--t-fg)' }
        }
      >
        <span className="poster__dots" aria-hidden="true" />
        <p className="poster__kicker">Final pressing sold out · last call</p>
        <h1 className="poster__title" style={fitW(winner === null ? 'Dead heat' : `${TEAM_META[winner].label} wins`)}>
          {winner === null ? (
            <>
              Dead <span className="hi">heat</span>
            </>
          ) : (
            <>
              {TEAM_META[winner].label} <span className="hi">wins</span>
            </>
          )}
        </h1>
        <p className="big-score" style={{ marginTop: 'clamp(0.5rem, 1.6dvh, 1rem)', ...fitW(`${totals[0]}:${totals[1]}`) }}>
          <span aria-hidden="true">
            {totals[0]}:{totals[1]}
          </span>
          <span className="sr-only">
            Blue {totals[0]}, Gold {totals[1]}
          </span>
        </p>
      </article>

      <Setlist
        state={state}
        title="Setlist"
        roundsShown={3}
        note={
          state.removed.length > 0
            ? `Cut from the deck along the way: ${state.removed.join(', ')}.`
            : undefined
        }
      />

      {actions}
    </div>
  )
}
