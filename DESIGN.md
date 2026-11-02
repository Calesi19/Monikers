# Monikers Pocket: design notes

## Brief
- Subject: Monikers, a pass-and-play party game. One phone, two teams (Blue, Gold), three rounds with the same deck.
- Audience: a room of friends passing one phone around, often at night, often loud.
- Job: be readable in a frantic 45/60/90-second turn, and make the hand-off safe (never reveal a card).
- Constraint: engine (`src/game/engine.ts`), save format, timers, scoring and phases are untouched. No new audio.

## Concept card
```
Idea:        Every round is another print run of the same zine; each pressing loses ink.
Metaphor:    A Risograph / photocopy print shop. Spot inks, misregistration, tape, stamps.
Signature:   The card fling: GOT IT throws the taped card up-right, PASS tosses it down-left,
             the next card springs up off the pile. Plus the round "pressing" swap of the
             whole atmosphere (4-colour zine -> two-tone xerox -> bootleg blackout).
Emotion:     A gig flyer you just tore off a lamp post: loud, cheap, joyful.
Motion verb: "slap down like a sticker" (overshoot spring, hard settle).
Screenshot:  The round 3 card glowing newsprint-and-marigold on soy black, mid-turn.
```

Why it fits only Monikers: the game's defining rule is the same deck reused across three
increasingly restrictive rounds. The three pressings make that rule visible: each round
literally strips colour (= words) away.

## Palette (never #fff / #000)
| Role | Hex |
|---|---|
| Ground: newsprint | #F5F0E6 |
| Surface: pulp | #EAE2D3 |
| Ink: soy black | #141413 |
| Pink | #FF2A85 |
| Cyan | #00A8E8 |
| Marigold | #FFD000 |
| Lime | #B5E61D |
| Orange | #FF5722 |
| Tape | rgba(242,232,201,.9) |
| R3 halftone charcoal | #2C2B29 |

Per-round tokens live on `html[data-round]`: `--bg --fg --muted --reg (misregistration ink)
--hi (highlight block) --team-a/b --got --pass --hazard`.
Team colours shift with the pressing: R1 Blue=cyan, Gold=marigold. R2 Blue=soy black, Gold=pink.
R3 Blue=newsprint, Gold=marigold. Team names are always printed in words too.

## Type
- Syne 800: display and card titles, uppercase, -0.03em, 0.95 leading, clamp() by name length.
- Space Grotesk 500/700: blurbs, rules, body.
- Space Mono 400/700: timer, stickers, meta, setlist tallies.
Self-hosted via @fontsource (same Google Fonts files) so the offline PWA keeps its type.

## Shape & motion
- Radius: 0. Paper is cut, not rounded. Exception: the price sticker (circle).
- Shadows: hard offsets only. Misregistration = `-5px -5px 0 var(--reg), 6px 6px 0 var(--shadow)`.
- Ease: `--spring: cubic-bezier(.2,.9,.3,1.3)` for anything landing; `--out: cubic-bezier(.2,.7,.2,1)` for leaving.
- Buttons: hover/focus lift -2/-2 and shadow grows; active slams +5/+5 with shadow 0.
- Idle: the hero letters' misregistration drifts slowly (the press never quite lines up). Off in reduced motion.
- Reduced motion: no fling, no jitter, no roller, no drift. Cards crossfade.

## Screens
- Home: ransom-note title, tape strip, three mini flyers previewing the three pressings.
- Setup: two gig tickets pick the mode (versus / co-op), two rows of newspaper clippings (deck size, turn length) with a slammed rubber stamp on the chosen one.
  (There is no card-drafting phase in the game; the stamp lives on the setup choices instead, so mechanics stay unchanged.)
- Round intro: pressing poster + per-round rule banner (tape / stencil / neon).
- Pass: full-bleed team poster, huge "START 60s TURN" sticker. No card on screen.
- Turn: 100dvh grid. Timer box + hazard bar, taped card on a pile, PASS / GOT IT thumb buttons.
- Summary: guessed names as clipped words.
- Round end / final: gig setlist with dotted leaders and per-round badges.

## Co-op mode
- Engine: `GameState.mode` ('versus' | 'coop', missing = versus) and `turns[round]`, counted in `startTurn`.
  Co-op keeps `turnTeam` at 0; points are still counted but the score is total turns (fewer is better).
- Colour: co-op uses the "got it" ink (`--coop` = lime, soy in round 2).
- Best score: localStorage `monikers-pocket-coop-best-v1`, keyed by deck size x turn seconds.
