# 05 — Daily Grumble

One screen a day. Four taps and one suggestion back. Under thirty seconds.

## The check-in

Shown once a day, ideally mid-afternoon (3–5 pm local, inside `contract.quiet_hours` never). Four questions, each a row of five faces or a short list; all skippable.

1. **Energy** (1–5). Maps to `energy_1_to_5` in the daily row.
2. **Hunger** (1–5). Maps to `hunger_1_to_5`.
3. **Mood** (1–5). Not in the synthetic data; new field `mood_1_to_5`. The face row, nothing else. Never the word "mood" in Spanish-first copy either; the question is "¿Cómo va el día?"
4. **Dinner tonight** — "Who's at the table?" with: just me / someone's coming / I'm going out / the Versailles table / don't know yet. Writes `dinner_company_today`.

Then the optional toggles for the day's standards that are self-reported (`protein_first`, `custom`), shown as a single row of chips after dinner time.

## The one suggestion

Grumble returns exactly one card. The selection is a ranked rules pass over the food graph plus today's answers. First match wins. Every card is: a dish or a place, a time, a walk, and a person, with the move stated.

| Priority | Condition | Card |
|---|---|---|
| 1 | Week is red (`thresholds.weekly.red_if`) | No suggestion. "Lourdes is going to call you this week. Tonight, whatever you were going to eat, eat it before {resolved last_meal_by} and walk ten minutes." Coach badge set. |
| 2 | Tuesday (or `accountable.table.usual_night`) and `open_to_table` | The table card: "Versailles, 6:30. {host name} has the table. Seat's yours if you want it." Buttons: I'll be there / not this week. |
| 3 | `dinner_company_today == "just me"` and buddy exists | Starred dinner from rotation + "and text {buddy} about the walk after. Ten minutes, {buddy}'s block and back." |
| 4 | `dinner_company_today == "just me"` and no buddy, `has_dog` | Starred dinner + "then {dog} gets the long way around the block. Ten minutes." |
| 5 | `dinner_company_today == "just me"`, nobody | Starred dinner, with the move, + "At the table, not the couch. Ten minutes outside after, the bay's right there." No invented companion. |
| 6 | `dinner_company_today == "going out"` | The `places` entry for a usual place: "{venue}: {order}. Skip the {avoid}. Walk to the car the long way." If none known, the nearest cuisine template. |
| 7 | `energy ≤ 2` or `hunger ≤ 2` or `appetite_pattern == cycles` and today is a low day | A `low_appetite_ok` dish from rotation: "Nothing heavy. {dish}. Sancocho counts as dinner." |
| 8 | Money tight this week (`weekly_food_budget_usd` < $70 and ≥ 2 restaurant meals logged this week) | A `cheap` dish from rotation with cost: "{dish}, about ${cost}. Beans first." |
| 9 | Day is amber for `last_meal_by` yesterday | Starred dinner + "an hour earlier than last night. That's the whole ask." |
| 10 | default | Starred dinner for today's slot with its move, the time, the walk. |

Every card ends with the time and the walk, so the two standards that matter most are on every screen without being nagged.

`contract.never_mention` filters cards: a card whose template is tagged with a listed topic (e.g. "weight", "alcohol") is skipped and the next priority fires.

## The nudge (amber)

If yesterday was amber, the check-in opens with one dry line before the questions, from `09-voice-and-copy.md` ("Nine forty last night. Not a crime. Tonight, eight."). One line, no streaks, no red marks, no "you missed".

## After dinner

If the tracker shows no steps 45 minutes after the last logged meal and the walk standard exists, one notification inside quiet hours only: "Ten minutes. Then I'll stop grumbling." Once. Never twice in a day.

## The plan screen

Reachable from the check-in. Renders the food graph as the person's plan: standards as their own statements with the why line small beneath, the rotation as cards with the move, places, and who shows up. Everything editable inline; edits re-validate and set `negotiated_on`.

## Data written per day

```json
{ "date": "2026-10-21", "energy_1_to_5": 3, "hunger_1_to_5": 2, "mood_1_to_5": 2,
  "dinner_company_today": "just me", "protein_first": true, "suggestion_shown": "p3-buddy-walk",
  "suggestion_accepted": null, "status": "amber", "status_reasons": ["dinner-by-8 missed"] }
```

Stored under `log.days[]` in the app state alongside the food graph (not inside the graph; the graph is the plan, the log is what happened).

## Tests

- Marisol on a Tuesday → the table card.
- Marisol on a Wednesday, "just me" → Carmen walk card.
- Tony, "just me", no buddy, no dog, budget $60 → priority 5 card with a `cheap` dish; never a dish over his budget.
- Jean at 1 pm (his evening) → cards resolve times relative to 09:00 sleep.
- Mood ≤ 2 three days running → week red → priority 1 card and the coach badge.
