# Grumble — the pitch deck

Seven slides, five minutes: about two minutes of slides, then the live demo and the close.

## Run it

Open `presentation/index.html` in a browser (double-click works), or run `npm run deck` and go to http://127.0.0.1:8765/presentation/ (local only, port 8765). It's one self-contained file. Offline, the fonts fall back to the system font and nothing else changes.

Start the app before the pitch (`npm run dev` at the repo root). The demo slide's **Open Grumble** button goes to `http://localhost:3000/today`. If the app runs on another port, open the deck as `index.html?app=http://localhost:3456`.

| Key | Does |
|---|---|
| → / Space / click right | next slide |
| ← / click left | previous |
| F | fullscreen |
| N | speaker notes (what to say, per slide) |
| T | the 5:00 timer, which turns coral past five minutes |

## The five minutes

| Time | Slide | The point |
|---|---|---|
| 0:00–0:25 | 1 · The problem | Food apps count the plate; nobody asks who's across the table. Grumble works on what, when (on your clock) and who with. |
| 0:25–0:50 | 2 · Mental health | NHANES, 808 real survivors: with severe depressive symptoms they eat *less* (1,414 vs 1,781 kcal), fiber collapses (10.9 vs 15.4 g), HbA1c 5.9 vs 5.7, diabetes 45% vs 22%. |
| 0:50–1:15 | 3 · The four levers | Money, social (friends, family, neighbors), the meals, time and routine: one number each (tagged NHANES real or challenge synthetic) and what Grumble does about it. Associations, not proof. |
| 1:10–1:40 | 4 · **The table** | The center of the pitch. One Tuesday at Versailles hits every lever: early dinner, food they love, the walk, a person across the table. Grumble asks who's at the table every day, names a person when you're alone, and saves the seat in one tap. Survivors host; donors pay $20 a seat. |
| 1:40–1:55 | 5 · Around the table | The daily loop: intake that learns, Today (log in plain words, the day rebalances), What if. |
| 1:55–4:30 | 6 · Demo | Marisol: the nudge, log a burger at lunch, dinner turns lean, check in → **the table card**, whole-day curve, save a seat. |
| 4:30–5:00 | 7 · Close | "Four levers. One evening. Someone across the table." |

## Before you present

- In the app: run the intake once, or tap **Show Marisol's plan** on Plan. Clear today's log (the × on each logged meal).
- Put `ANTHROPIC_API_KEY` in `.env` so the freeform logging uses Claude. Without it, a word match stands in.

## Where the numbers come from

Every number is from `12-evidence-pack.md`, which is built from the `analysis/` scripts:
- Slide 2: NHANES 2011–2014, real, unweighted, observational.
- Slide 3: the challenge's synthetic program and CGM data (the Crane Lab's design), labeled as such on the slide.

Change a number in `12` first, then here.
