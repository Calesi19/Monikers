import { useEffect, useRef, useState } from 'react'
import {
  ROUND_RULES,
  afterSummary,
  currentCard,
  endTurn,
  gotIt,
  nextRound,
  passCard,
  removeCard,
  startTurn,
  toPassScreen,
  totalScores,
  type GameState,
} from '../game/engine'
import type { NameCard } from '../game/names'
import { beep, buzz, keepAwake, primeAudio } from '../fx'
import {
  Btn,
  PRESSINGS,
  RuleBanner,
  ScoreBug,
  Setlist,
  TEAM_META,
  TeamChip,
  cn,
  pad2,
} from '../ui'

export type Act = (fn: (s: GameState) => GameState) => void

function Header({ state }: { state: GameState }) {
  return (
    <div className="hdr">
      <div className="hdr__row">
        <span className="chip">
          R{pad2(state.round + 1)} · {ROUND_RULES[state.round].title}
        </span>
        <span className="meta muted">{state.remaining.length} cards in the pile</span>
      </div>
      <ScoreBug totals={totalScores(state)} />
    </div>
  )
}

/** Split a title so its last word sits on the highlight block. */
export function fitW(text: string): Record<string, string> {
  return { ['--w']: String(Math.max(...text.split(/\s+/).map((w) => w.length))) }
}

function HiTitle({ text }: { text: string }) {
  const i = text.lastIndexOf(' ')
  if (i < 0) return <span className="hi">{text}</span>
  return (
    <>
      {text.slice(0, i)} <span className="hi">{text.slice(i + 1)}</span>
    </>
  )
}

export function RoundIntro({ state, act }: { state: GameState; act: Act }) {
  const rule = ROUND_RULES[state.round]
  return (
    <div className="screen">
      {state.round > 0 && <div className="roller" aria-hidden="true" />}
      <Header state={state} />
      <article className="poster">
        <span className="poster__dots" aria-hidden="true" />
        <p className="poster__kicker">
          Pressing {pad2(state.round + 1)} of 03 · {PRESSINGS[state.round].name}
        </p>
        <h1 className="poster__title" style={fitW(rule.title)}>
          <HiTitle text={rule.title} />
        </h1>
        <p className="poster__body">{rule.rule}</p>
        <div className="poster__foot">
          <span className="stamp">Same {state.deck.length} cards</span>
          <span className="stamp">{state.turnSeconds}s turns</span>
        </div>
      </article>
      <RuleBanner round={state.round} />
      <Btn variant="primary" onClick={() => act(toPassScreen)}>
        Start round {state.round + 1}
      </Btn>
    </div>
  )
}

export function PassScreen({ state, act }: { state: GameState; act: Act }) {
  const team = state.turnTeam
  return (
    <div className="screen">
      <Header state={state} />
      <article className={cn('poster poster--team', team === 0 ? 'team-a' : 'team-b')}>
        <span className="poster__dots" aria-hidden="true" />
        <p className="poster__kicker">
          Now on deck · R{pad2(state.round + 1)} {ROUND_RULES[state.round].title}
        </p>
        <h1 className="poster__title" style={fitW(`${TEAM_META[team].label} team`)}>
          {TEAM_META[team].label}
          <br />
          team
        </h1>
        <p className="poster__body">
          Hand the phone to whoever gives the clues this turn. Everyone else on
          the {TEAM_META[team].label} team guesses. The other team keeps their
          eyes off the screen.
        </p>
      </article>
      <RuleBanner round={state.round} />
      <Btn
        variant="start"
        onClick={() => {
          primeAudio()
          act((s) => startTurn(s, Date.now()))
        }}
      >
        <span>
          Start {state.turnSeconds}
          <span className="lc">s</span> turn
        </span>
        <span className="btn__tag">The card shows when you tap</span>
      </Btn>
    </div>
  )
}

type Fling = 'got' | 'pass' | 'remove'
interface Ghost {
  id: number
  card: NameCard
  kind: Fling
}

function titleLen(name: string): 's' | 'm' | 'l' | 'xl' {
  const n = name.length
  if (n <= 8) return 's'
  if (n <= 13) return 'm'
  if (n <= 20) return 'l'
  return 'xl'
}

/** The card itself: tape, price-gun sticker, headline, double rule, bio, category stamp. */
function MonikerCard({
  card,
  no,
  of,
  className,
  ghost = false,
  onAnimationEnd,
}: {
  card: NameCard
  no: number
  of: number
  className?: string
  ghost?: boolean
  onAnimationEnd?: () => void
}) {
  const longest = Math.max(...card.name.split(/\s+/).map((w) => w.length))
  return (
    <article
      className={cn('mcard', className)}
      data-len={titleLen(card.name)}
      style={{ ['--w' as string]: String(Math.max(longest, 5)) }}
      aria-hidden={ghost || undefined}
      aria-live={ghost ? undefined : 'polite'}
      onAnimationEnd={onAnimationEnd}
    >
      <span className="mcard__tape" aria-hidden="true" />
      <span className="mcard__no" aria-hidden="true">
        No.{pad2(no)}/{pad2(of)}
      </span>
      <span className="mcard__price">
        <span aria-hidden="true">
          <b>1</b>PT
        </span>
        <span className="sr-only">Worth 1 point</span>
      </span>
      <div className="mcard__title-wrap">
        <h2 className="mcard__title">{card.name}</h2>
      </div>
      <div>
        <div className="dbl-rule" aria-hidden="true" />
        <p className="mcard__bio" style={{ marginTop: '0.625rem' }}>
          {card.blurb}
        </p>
      </div>
      <span className="stamp mcard__cat">{card.tag}</span>
    </article>
  )
}

export function TurnScreen({ state, act }: { state: GameState; act: Act }) {
  const [leftMs, setLeftMs] = useState(
    () => (state.turnEndsAt ?? Date.now()) - Date.now(),
  )
  const [armedRemove, setArmedRemove] = useState<string | null>(null)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [bump, setBump] = useState(0)
  const ghostId = useRef(0)
  const firedRef = useRef(false)
  const card = currentCard(state)

  useEffect(() => {
    void keepAwake(true)
    return () => {
      void keepAwake(false)
    }
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      const left = (state.turnEndsAt ?? 0) - Date.now()
      setLeftMs(left)
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true
        beep()
        buzz([200, 80, 300])
        act(endTurn)
      }
    }, 100)
    return () => clearInterval(iv)
  }, [state.turnEndsAt, act])

  useEffect(() => {
    if (!bump) return
    const t = setTimeout(() => setBump(0), 280)
    return () => clearTimeout(t)
  }, [bump])

  if (!card) return null
  const seconds = Math.max(0, Math.ceil(leftMs / 1000))
  const fraction = Math.max(0, Math.min(1, leftMs / (state.turnSeconds * 1000)))
  const low = seconds <= 10
  const no = state.deck.findIndex((c) => c.name === card.name) + 1
  const team = state.turnTeam

  function throwCard(kind: Fling) {
    if (!card) return
    ghostId.current += 1
    const g = { id: ghostId.current, card, kind }
    setGhosts((gs) => [...gs.slice(-3), g])
  }

  function onGot() {
    throwCard('got')
    act(gotIt)
  }
  function onPass() {
    if (state.remaining.length <= 1) {
      // Last card in the pile: passing would hand back the same card.
      setBump((b) => b + 1)
      return
    }
    throwCard('pass')
    act(passCard)
  }

  return (
    <div className="turn">
      <div className="turn__team">
        <h1 className="sr-only">
          {TEAM_META[team].label} team turn, round {state.round + 1}
        </h1>
        <TeamChip team={team} />
        <span className="turn__rule">
          R{pad2(state.round + 1)} // {ROUND_RULES[state.round].title}
        </span>
      </div>

      <div
        className={cn('timer', low && 'timer--panic')}
        role="timer"
        aria-label={`${seconds} seconds left`}
      >
        <span className="timer__num" aria-hidden="true">
          {pad2(seconds)}
        </span>
        <span className="timer__meta" aria-hidden="true">
          <span>{low ? 'Hurry up' : 'Seconds left'}</span>
          <span>
            {state.turnGuessed.length} got · {state.remaining.length} in pile
          </span>
        </span>
        <div className="timer__track" aria-hidden="true">
          <div
            className="timer__fill"
            style={{ transform: `scaleX(${fraction})` }}
          />
        </div>
      </div>

      <div className={cn('deck', bump > 0 && 'deck--bump')}>
        {state.remaining.length > 2 && <span className="deck__sheet" aria-hidden="true" />}
        {state.remaining.length > 1 && <span className="deck__sheet" aria-hidden="true" />}
        <MonikerCard
          key={card.name}
          card={card}
          no={no}
          of={state.deck.length}
          className="mcard--enter"
        />
        {ghosts.map((g) => (
          <MonikerCard
            key={g.id}
            card={g.card}
            no={Math.max(1, state.deck.findIndex((c) => c.name === g.card.name) + 1)}
            of={state.deck.length}
            ghost
            className={cn('mcard--ghost', `is-${g.kind}`)}
            onAnimationEnd={() =>
              setGhosts((gs) => gs.filter((x) => x.id !== g.id))
            }
          />
        ))}
      </div>

      <div className="thumbs">
        <Btn variant="pass" onClick={onPass}>
          Pass
        </Btn>
        <Btn variant="got" onClick={onGot}>
          Got it!
        </Btn>
      </div>

      <div className="turn__foot">
        <button
          type="button"
          className={cn('linkish', armedRemove === card.name && 'linkish--armed')}
          onClick={() => {
            if (armedRemove === card.name) {
              setArmedRemove(null)
              throwCard('remove')
              act(removeCard)
            } else {
              setArmedRemove(card.name)
            }
          }}
        >
          {armedRemove === card.name
            ? 'Tap again: nobody knows it, remove'
            : 'Remove this card from the game'}
        </button>
      </div>
    </div>
  )
}

export function TurnSummary({ state, act }: { state: GameState; act: Act }) {
  const team = state.turnTeam
  const nextTeam = team === 0 ? 1 : 0
  const n = state.turnGuessed.length
  return (
    <div className="screen">
      <Header state={state} />
      <article className={cn('poster', team === 0 ? 'team-a' : 'team-b')} style={{ ['--p-bg' as string]: 'var(--t-bg)', ['--p-fg' as string]: 'var(--t-fg)' }}>
        <span className="poster__dots" aria-hidden="true" />
        <p className="poster__kicker">
          {state.deckCleared ? 'Pile empty · round over' : "Time's up"} ·{' '}
          {TEAM_META[team].label} team
        </p>
        <h1 className="big-score" style={{ marginTop: '0.5rem', ...fitW(`+${n}`) }}>
          +{n}
          <span className="sr-only"> {n === 1 ? 'card' : 'cards'} this turn</span>
        </h1>
        <p className="poster__body">
          {state.deckCleared
            ? 'That was the last card in the pile. The round is done.'
            : 'The card in hand goes back into the pile for the next team.'}
        </p>
      </article>

      {n > 0 ? (
        <ul className="clips-out" aria-label="Guessed this turn">
          {state.turnGuessed.map((name, i) => (
            <li
              key={name}
              style={{
                ['--i' as string]: i,
                ['--r' as string]: `${((i * 37) % 5) - 2}deg`,
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="lede muted" style={{ alignSelf: 'center', textAlign: 'center' }}>
          Nothing that turn. The other team sends its thanks.
        </p>
      )}

      <Btn variant={state.remaining.length === 0 ? 'primary' : nextTeam === 0 ? 'teama' : 'teamb'} onClick={() => act(afterSummary)}>
        {state.remaining.length === 0
          ? 'See round results'
          : `Pass to the ${TEAM_META[nextTeam].label} team`}
      </Btn>
    </div>
  )
}

export function RoundEnd({ state, act }: { state: GameState; act: Act }) {
  const r = state.scores[state.round]
  return (
    <div className="screen">
      <div>
        <p className="meta muted">
          Pressing {pad2(state.round + 1)} sold out · {PRESSINGS[state.round].name}
        </p>
        <h1
          className="display misreg"
          style={{ fontSize: 'clamp(2.75rem, 13vw, 4rem)', marginTop: '0.375rem' }}
        >
          Round {state.round + 1} done
        </h1>
        <p className="lede" style={{ marginTop: '0.75rem' }}>
          Blue took {r[0]}, Gold took {r[1]} this round.
          {state.round < 2 &&
            ` Next pressing: ${PRESSINGS[state.round + 1].name}, ${ROUND_RULES[state.round + 1].title.toLowerCase()}.`}
        </p>
      </div>

      <Setlist
        state={state}
        title="Setlist so far"
        roundsShown={state.round + 1}
      />

      <Btn variant="primary" onClick={() => act(nextRound)}>
        {state.round >= 2 ? 'See final results' : `Start round ${state.round + 2}`}
      </Btn>
    </div>
  )
}
