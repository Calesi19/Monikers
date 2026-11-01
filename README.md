# Monikers Pocket

The Monikers party game as a pass-and-play web app: one phone, two teams,
three rounds. Describe the name, then one word only, then charades — with
the same deck all the way through.

**Play it:** https://calesi19.github.io/Monikers-Pocket/

- 181 built-in name cards with a short blurb each
- 30/40/50-card decks, 45/60/90-second turns
- The game saves itself after every move — refresh, lock the phone, come
  back later and resume
- Installable as a PWA and fully playable offline once loaded

Built with React + TypeScript + Vite, styled with plain CSS as a Risograph zine
(design notes in `DESIGN.md`; fonts are self-hosted so it still works offline). The game logic lives in
`src/game/engine.ts` as a pure, serializable state machine; the deck is in
`src/game/names.ts`.

## Develop

```bash
npm install
npm run dev     # local dev server
npm run build   # type-check + production build to dist/
```

Pushes to `main` deploy to GitHub Pages via Actions.
