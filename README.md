# Journal Insights

Write daily journal entries (mood, energy, sleep, tags, text) and get a dashboard of what affects your mood, a persona report, and ranked suggestions for changes to try.

- `server/` — Node + Express API. Reads and writes entries in `data/journal-entries.json` and computes insights.
- `client/` — React + Vite + Tailwind dashboard.
- `data/journal-entries.json` — demo entries from Sep 1 to Oct 29, 2026. Oct 16–29 are hand-written; the rest come from `server/scripts/seed-demo.mjs` (`npm run seed:demo --prefix server`; it only fills dates that have no entry).

The app has three tabs:
- **📝 Today**: check in with a mood face, energy, sleep and activity chips, and get feedback once you save. Also shows your streak and last 7 days.
- **📅 Journal**: a month calendar of mood faces. Tap a day to read it, see its feedback, edit it, or fill in a missed day.
- **📊 Insights**: stats, mood chart, persona, what affects your mood, and changes to try.

## Run (no Docker)

```bash
npm run setup   # first time only: installs root, server and client deps
npm run dev     # starts the API (port 3000) and the app (port 5173)
```

Open http://localhost:5173. The client proxies `/api` to port 3000. Press `Ctrl+C` to stop both.

## API

| Method | Path | |
|---|---|---|
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/entries` | all entries, oldest first |
| POST | `/api/entries` | add an entry (one per date; same date replaces); returns `{ entry, feedback }` |
| GET | `/api/entries/:date/feedback` | what went well that day and what to try instead |
| GET | `/api/insights` | summary, mood trend, factors, persona, suggestions |

## How insights work

`server/src/services/insights.ts` compares average mood on days *with* vs *without* each factor (7h+ sleep, movement, people, heavy phone use, job search, focused work). A difference of 0.75 points or more counts as "lifts" or "drags" your mood. The persona, strengths, challenges and suggestions are built from those results and from tags such as `overcommit`, `skipped-meal` and `anxiety`. Tag your entries consistently for the best results.

## Tests

```bash
cd server && npm test
```
