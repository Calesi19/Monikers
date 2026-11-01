import { totalScores, type GameState } from '../game/engine'
import { Btn, Setlist, TEAM_META, cn } from '../ui'
import { fitW } from './Play'

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
  const totals = totalScores(state)
  const winner =
    totals[0] === totals[1] ? null : totals[0] > totals[1] ? 0 : 1
  return (
    <div className="screen">
      <article
        className={cn('poster', winner === 0 && 'team-a', winner === 1 && 'team-b')}
        style={
          winner === null
            ? undefined
            : { ['--p-bg' as string]: 'var(--t-bg)', ['--p-fg' as string]: 'var(--t-fg)' }
        }
      >
        <span className="poster__dots" aria-hidden="true" />
        <p className="poster__kicker">Final pressing sold out · last call</p>
        <h1 className="poster__title" style={fitW(winner === null ? 'Dead heat' : `${TEAM_META[winner].label} team wins`)}>
          {winner === null ? (
            <>
              Dead <span className="hi">heat</span>
            </>
          ) : (
            <>
              {TEAM_META[winner].label} team <span className="hi">wins</span>
            </>
          )}
        </h1>
        <p className="big-score" style={{ marginTop: '1rem', ...fitW(`${totals[0]}:${totals[1]}`) }}>
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
        title="Final setlist"
        roundsShown={3}
        note={
          state.removed.length > 0
            ? `Cut from the deck along the way: ${state.removed.join(', ')}.`
            : undefined
        }
      />

      <div className="btn-row">
        <Btn variant="primary" onClick={onPlayAgain}>
          Play again
        </Btn>
        <Btn variant="paper" onClick={onSetup}>
          Change settings
        </Btn>
        <Btn variant="paper" onClick={onHome}>
          Home
        </Btn>
      </div>
    </div>
  )
}
