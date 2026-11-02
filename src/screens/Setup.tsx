import { useState } from 'react'
import type { GameConfig } from '../game/engine'
import { Btn, SectionHead, TEAM_META } from '../ui'

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

  return (
    <div className="screen">
      <div>
        <div className="topbar" style={{ marginBottom: 0 }}>
          <p className="meta muted">Issue setup · two teams, one phone</p>
          <button type="button" className="linkish" onClick={onBack}>
            Back
          </button>
        </div>
        <h1 className="display misreg page-title">New game</h1>
      </div>

      <div className="tickets">
        {TEAM_META.map((t, i) => (
          <div key={t.label} className={`ticket ${i === 0 ? 'team-a' : 'team-b'}`} style={{ background: 'var(--t-bg)', color: 'var(--t-fg)' }}>
            <div className="ticket__head">
              <span>Backstage pass</span>
            </div>
            <p className="ticket__name">{t.label}</p>
            <div className="ticket__stub">
              <span>{i === 0 ? 'Leads R01' : 'Goes 2nd'}</span>
              <span className="ticket__no">No.{String(i + 1).padStart(2, '0')}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="lede muted setup-lede">
        Split the room into two teams. That is all the setup there is: the
        phone keeps the cards, the clock and the score.
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
        <Btn variant="primary" onClick={() => onStart({ deckSize, turnSeconds })}>
          Print the deck <span className="btn__tag">{deckSize} cards</span>
        </Btn>
      </div>
    </div>
  )
}
