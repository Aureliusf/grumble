# Grumble — the pitch deck

Six slides, five minutes: about two minutes of slides, then the live demo and the close.

## Run it

Open `presentation/index.html` in a browser (double-click works). It's one self-contained file. Offline, the fonts fall back to the system font and nothing else changes.

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
| 0:00–0:30 | 1 · The problem | Food apps count the plate; nobody asks who's across the table. Grumble works on what, when (on your clock) and who with. |
| 0:30–1:00 | 2 · Mental health | NHANES, 808 real survivors: with severe depressive symptoms they eat *less* (1,414 vs 1,781 kcal), fiber collapses (10.9 vs 15.4 g), HbA1c 5.9 vs 5.7, diabetes 45% vs 22%. Grumble asks how the day is going, calls in the coach, never labels. |
| 1:00–1:30 | 3 · What works | Coaching −0.22 vs tips −0.06 HbA1c (4×). Walk after dinner: 65 → 42 mg/dL, and 20 minutes adds nothing. |
| 1:30–1:50 | 4 · What we built | Intake that learns → Today (log in plain words, the day rebalances) → What if → the table. |
| 1:50–4:30 | 5 · Demo | Marisol: the nudge, log a burger at lunch, dinner turns lean, check in → the table card, whole-day curve, save a seat. |
| 4:30–5:00 | 6 · Close | "Coaching beat tips four to one. The relationship did the work. So we built a table." |

## Before you present

- In the app: run the intake once, or tap **Show Marisol's plan** on Plan. Clear today's log (the × on each logged meal).
- Put `ANTHROPIC_API_KEY` in `.env` so the freeform logging uses Claude. Without it, a word match stands in.

## Where the numbers come from

Every number is from `12-evidence-pack.md`, which is built from the `analysis/` scripts:
- Slide 2: NHANES 2011–2014, real, unweighted, observational.
- Slide 3: the challenge's synthetic program and CGM data (the Crane Lab's design), labeled as such on the slide.

Change a number in `12` first, then here.
