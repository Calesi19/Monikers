import { useCallback, useEffect, useState } from 'react'
import {
  endTurn,
  newGame,
  totalScores,
  type GameConfig,
  type GameState,
} from './game/engine'
import { Setup } from './screens/Setup'
import {
  PassScreen,
  RoundEnd,
  RoundIntro,
  TurnScreen,
  TurnSummary,
} from './screens/Play'
import { GameEnd } from './screens/End'
import { Btn, HowToPlay } from './ui'
import { ROUND_RULES } from './game/engine'

const SAVE_KEY = 'monikers-pocket-save-v2'

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    if (s.phase === 'turn') {
      // Saved mid-turn: resume if time is left, otherwise close the turn out.
      return s.turnEndsAt && s.turnEndsAt > Date.now() ? s : endTurn(s)
    }
    return s
  } catch {
    return null
  }
}

type Screen = 'home' | 'setup' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [game, setGame] = useState<GameState | null>(loadSave)
  const [armQuit, setArmQuit] = useState(false)

  useEffect(() => {
    try {
      if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(game))
    } catch {
      // storage full/blocked — the game still plays, it just won't resume
    }
  }, [game])

  const act = useCallback((fn: (s: GameState) => GameState) => {
    setGame((g) => (g ? fn(g) : g))
  }, [])

  function startGame(config: GameConfig) {
    setGame(newGame(config))
    setScreen('game')
  }

  function quitToHome() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      // ignore
    }
    setGame(null)
    setArmQuit(false)
    setScreen('home')
  }

  function playAgain() {
    if (!game) return
    startGame({
      turnSeconds: game.turnSeconds,
      deckSize: game.deck.length + game.removed.length,
    })
  }

  const resumable = game !== null && game.phase !== 'gameEnd'
  const inGame = screen === 'game' && game !== null
  const round = inGame ? game.round + 1 : 1
  const phase = inGame ? game.phase : screen

  // The whole print shop follows the round: tokens live on <html data-round>.
  useEffect(() => {
    document.documentElement.dataset.round = String(round)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', round === 3 ? '#141413' : '#F5F0E6')
  }, [round])

  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <span className="b1" />
        <span className="b2" />
      </div>
      <div className="platen" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <a className="skip" href="#main">
        Skip to game
      </a>
      <div className="shell" data-round={round} data-phase={phase}>
        {inGame && (
          <div className="topbar">
            <span className="meta muted" aria-hidden="true">
              Monikers · R{String(round).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => (armQuit ? quitToHome() : setArmQuit(true))}
              onBlur={() => setArmQuit(false)}
              className={armQuit ? 'linkish linkish--armed' : 'linkish'}
            >
              {armQuit ? 'Tap again to end this game' : 'End game'}
            </button>
          </div>
        )}

        <main id="main" tabIndex={-1}>
          {screen === 'home' && (
            <div className="screen">
              <header className="masthead">
                <p className="meta muted">Issue No.01 · pass-and-play party game</p>
                <h1>
                  <span className="sr-only">Monikers Pocket</span>
                  <span className="ransom" aria-hidden="true">
                    {[LETTERS.slice(0, 4), LETTERS.slice(4)].map((row, ri) => (
                      <span className="ransom__row" key={ri}>
                        {row.map((l, j) => (
                          <span
                            key={l.ch + j}
                            style={{
                              ['--i' as string]: ri * 4 + j,
                              ['--l-bg' as string]: l.bg,
                              ['--l-fg' as string]: l.fg,
                              ['--l-rot' as string]: l.rot,
                              ['--l-reg' as string]: l.reg,
                              ['--l-reg2' as string]: l.reg2,
                            }}
                          >
                            {l.ch}
                          </span>
                        ))}
                      </span>
                    ))}
                  </span>
                </h1>
                <div className="masthead__sub">
                  <span className="tape">Pocket edition · one phone</span>
                  <p className="lede" style={{ textAlign: 'center' }}>
                    Two teams, three rounds, one deck of names. Describe it, then
                    say one word, then act it out in silence.
                  </p>
                </div>
              </header>

              <ol className="pressings" aria-label="The three rounds">
                {ROUND_RULES.map((r, i) => (
                  <li className="flyer" key={r.title}>
                    <span className="flyer__no">{FLYER_RULES[i]}</span>
                    <span className="flyer__big" aria-hidden="true">{i + 1}</span>
                    <span className="flyer__word">
                      <span className="sr-only">Round {i + 1}: </span>
                      {r.title}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="btn-row">
                <Btn variant="primary" onClick={() => setScreen('setup')}>
                  New game
                </Btn>
                {resumable && game && (
                  <Btn variant="teama" onClick={() => setScreen('game')}>
                    Resume
                    <span className="btn__tag">
                      R{String(game.round + 1).padStart(2, '0')} · {totalScores(game)[0]}:
                      {totalScores(game)[1]}
                    </span>
                  </Btn>
                )}
                <HowToPlay />
              </div>
            </div>
          )}

          {screen === 'setup' && (
            <Setup onStart={startGame} onBack={() => setScreen('home')} />
          )}

          {screen === 'game' && game && (
            <>
              {game.phase === 'roundIntro' && (
                <RoundIntro key={`intro-${game.round}`} state={game} act={act} />
              )}
              {game.phase === 'pass' && <PassScreen state={game} act={act} />}
              {game.phase === 'turn' && <TurnScreen state={game} act={act} />}
              {game.phase === 'turnSummary' && (
                <TurnSummary state={game} act={act} />
              )}
              {game.phase === 'roundEnd' && <RoundEnd state={game} act={act} />}
              {game.phase === 'gameEnd' && (
                <GameEnd
                  state={game}
                  onPlayAgain={playAgain}
                  onSetup={() => setScreen('setup')}
                  onHome={quitToHome}
                />
              )}
            </>
          )}
        </main>

        {phase !== 'turn' && (
          <footer className="colophon">
            <span>Monikers Pocket</span>
            <span>Printed on one phone</span>
          </footer>
        )}
      </div>
    </>
  )
}

const LETTERS: { ch: string; bg: string; fg: string; rot: string; reg: string; reg2: string }[] = [
  { ch: 'M', bg: 'var(--soy)', fg: 'var(--newsprint)', rot: '-4deg', reg: 'var(--pink)', reg2: 'var(--cyan)' },
  { ch: 'O', bg: 'var(--marigold)', fg: 'var(--soy)', rot: '3deg', reg: 'var(--cyan)', reg2: 'var(--pink)' },
  { ch: 'N', bg: 'var(--pink)', fg: 'var(--soy)', rot: '-2deg', reg: 'var(--newsprint)', reg2: 'var(--marigold)' },
  { ch: 'I', bg: 'var(--newsprint)', fg: 'var(--soy)', rot: '5deg', reg: 'var(--cyan)', reg2: 'var(--pink)' },
  { ch: 'K', bg: 'var(--cyan)', fg: 'var(--soy)', rot: '-3deg', reg: 'var(--newsprint)', reg2: 'var(--pink)' },
  { ch: 'E', bg: 'var(--soy)', fg: 'var(--marigold)', rot: '2deg', reg: 'var(--pink)', reg2: 'var(--cyan)' },
  { ch: 'R', bg: 'var(--lime)', fg: 'var(--soy)', rot: '-5deg', reg: 'var(--newsprint)', reg2: 'var(--pink)' },
  { ch: 'S', bg: 'var(--pink)', fg: 'var(--newsprint)', rot: '3deg', reg: 'var(--soy)', reg2: 'var(--marigold)' },
]

const FLYER_RULES = ['The zine', 'Xerox', 'Bootleg']
