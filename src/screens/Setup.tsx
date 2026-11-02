import { useState } from 'react'
import type { GameConfig, GameMode } from '../game/engine'
import { Btn, SectionHead } from '../ui'

interface Clip<T> {
  value: T
  unit: string
  note: string
}

/** Newspaper clippings you stamp to choose. Only one per row is locked in. */
function Clippings<T extends number>({
  labelId,
  options,
  value,
  onChange,
  stamp,
}: {
  labelId: string
  options: Clip<T>[]
  value: T
  onChange: (v: T) => void
  stamp: string
}) {
  return (
    <div className="clippings" role="group" aria-labelledby={labelId}>
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            className="clip"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
          >
            <span className="clip__num">{o.value}</span>
            <span className="clip__unit">{o.unit}</span>
            <span className="clip__note">{o.note}</span>
            {on && (
              <span className="clip__stamp" aria-hidden="true">
                {stamp}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

const MODES: { value: GameMode; head: string; big: string; unit: string; stub: string }[] = [
  { value: 'versus', head: 'Versus', big: '2', unit: 'teams', stub: 'Most cards wins' },
  { value: 'coop', head: 'Co-op', big: '1', unit: 'team', stub: 'Fewest turns wins' },
]

const DECKS: Clip<number>[] = [
  { value: 30, unit: 'cards', note: 'Short set' },
  { value: 40, unit: 'cards', note: 'The usual' },
  { value: 50, unit: 'cards', note: 'Long night' },
]
const CLOCKS: Clip<number>[] = [
  { value: 45, unit: 'seconds', note: 'Pure panic' },
  { value: 60, unit: 'seconds', note: 'House rules' },
  { value: 90, unit: 'seconds', note: 'Gentle crowd' },
]

export function Setup({
  onStart,
  onBack,
}: {
  onStart: (config: GameConfig) => void
  onBack: () => void
}) {
  const [deckSize, setDeckSize] = useState(40)
  const [turnSeconds, setTurnSeconds] = useState(60)
  const [mode, setMode] = useState<GameMode>('versus')

  return (
    <div className="screen">
      <div>
        <div className="topbar" style={{ marginBottom: 0 }}>
          <p className="meta muted">Issue setup · one phone</p>
          <button type="button" className="linkish" onClick={onBack}>
            Back
          </button>
        </div>
        <h1 className="display misreg page-title">New game</h1>
      </div>

      <div className="tickets" role="group" aria-label="Game mode">
        {MODES.map((m) => {
          const on = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={on}
              onClick={() => setMode(m.value)}
              className={`ticket ticket--pick ticket--${m.value}`}
            >
              <span className="ticket__head">
                <span>{m.head}</span>
              </span>
              <span className="ticket__name">
                <span className="ticket__big">{m.big}</span>
                <span className="ticket__unit">{m.unit}</span>
              </span>
              <span className="ticket__stub">
                <span>{m.stub}</span>
              </span>
              {on && (
                <span className="clip__stamp ticket__stamp" aria-hidden="true">
                  LOCKED IN
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="lede muted setup-lede">
        {mode === 'versus'
          ? 'Split the room into Blue and Gold. Teams swap the phone every turn and the most cards after three rounds wins.'
          : 'Everyone plays together and takes turns giving clues. Clear all three rounds in as few turns as you can.'}
      </p>

      <section>
        <SectionHead id="deck-label">Cards in the deck</SectionHead>
        <Clippings
          labelId="deck-label"
          options={DECKS}
          value={deckSize}
          onChange={setDeckSize}
          stamp="IN THE POOL"
        />
      </section>

      <section>
        <SectionHead id="clock-label">Seconds per turn</SectionHead>
        <Clippings
          labelId="clock-label"
          options={CLOCKS}
          value={turnSeconds}
          onChange={setTurnSeconds}
          stamp="LOCKED IN"
        />
      </section>

      <div className="btn-row" style={{ marginTop: 'auto' }}>
        <Btn variant="primary" onClick={() => onStart({ deckSize, turnSeconds, mode })}>
          Print the deck <span className="btn__tag">{deckSize} cards</span>
        </Btn>
      </div>
    </div>
  )
}
