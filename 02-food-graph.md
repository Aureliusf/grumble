# 02 — The food graph

The food graph is the only state in Grumble. One JSON object per person, validated against `data/food-graph.schema.json`. Intake writes it, every screen reads it, the daily check-in and the coach revise it.

It is the Attestify Combined Assurance Blueprint applied to one person:

| Attestify step | Food graph section | What it holds |
|---|---|---|
| Risk source and risk event | `risks` | company, taste, money, convenience — what intake learned about each |
| Control standard | `standards` | what a good day is, in the person's words, with a value and a why |
| Assurance procedure | `procedures` | per standard: which data source checks it, how often, the rule |
| Risk evaluation | `thresholds` | when a day or week is green, amber, red; what each triggers |
| Accountable person | `accountable` | coach (always), buddy, table role, dog |
| (the governance graph itself) | `dishes` | the person's rotation with the move that keeps each dish; restaurant playbook |
| (coaching contract) | `contract` | how Grumble is allowed to talk to this person |

Two examples ship with the spec:

- `data/example-food-graph.marisol.json` — the demo persona. Six standards, six procedures, a Tuesday table, Spanish statements.
- `data/example-food-graph.founder.json` — derived from a real 13-week program journal, health details removed. 49 rotation items, 12 restaurant entries, 10 standards. Use it to stress-test rendering; it is what a mature graph looks like after three months.

## Rules for the code

1. **Validate on every write.** Use Ajv (or Zod generated from the schema). An invalid graph never reaches localStorage.
2. **Standards are the person's words.** `statement` is shown verbatim on the "your plan" screen. `kind` and `value` are what the code reads. Never regenerate `statement` from `value`.
3. **`relative_to_sleep` changes the computation.** When true, a `last_meal_by` value of `"3h"` means three hours before `person.schedule.sleep_start`. When false, it is a clock time. Night shift always uses true. The intake sets this; the UI shows the resolved clock time.
4. **Procedures are declarative.** `computation` is plain language for the human reading the graph; the code implements one function per `kind` (see table below). Do not eval the string.
5. **Thresholds reference standard ids.** `"dinner-by-8 missed"` means the procedure for standard `dinner-by-8` returned false today. `"missed 3+ days"` is over the trailing 7. Supported predicates: `missed`, `missed N+ days`, `exceeded`, `no log N consecutive days`, `mood <= N on N days`, `cgm time above 180 mg/dL > N%`, `no food logged and no check-in`.
6. **The accountable coach is never null.** Every graph has a coach. If intake produces none, the default is the Sylvester survivorship line.
7. **`dishes.rotation[].dish_id`** is an id from `dishes.json` when it matches, else a slug of free text. The simulator only runs on dishes it can find; the UI says "I don't have numbers for that one yet" otherwise.
8. **`contract.never_mention`** is enforced in copy selection: a suggestion template tagged with a topic in this list is skipped.

## Procedure implementations by `kind`

| `kind` | Source | Pass when |
|---|---|---|
| `last_meal_by` | meal_log | last item >5 kcal on the 4 am–4 am eating day ≤ resolved time |
| `first_meal_by` | meal_log | first item >5 kcal ≤ resolved time |
| `walk_after_dinner_min` | tracker_steps or daily_checkin | ≥ 80 steps/min × value within 60 min after last meal, or self-report toggle |
| `overnight_fast_hours` | meal_log | hours from last bite to first bite ≥ value (needs both days logged) |
| `protein_first` | daily_checkin | toggle on the dinner card |
| `starch_portion_g` | meal_log | logged starch portion ≤ value × 1.2 |
| `fiber_g_per_day`, `protein_g_per_day`, `calories_per_day` | meal_log | daily sum vs value (calories: ≤; others: ≥) |
| `social_nights_per_week` | meal_log | days with calories > 1.3 × daily target ≤ value |
| `alcohol_drinks_per_week` | meal_log | ≤ value |
| `vegetables_meals_per_day` | meal_log | meals tagged vegetable ≥ value |
| `home_cooked_days_per_week` | meal_log | days with no restaurant-tagged meal ≥ value |
| `legume_meals_per_week` | meal_log | ≥ value |
| `custom` | any | code does not evaluate; shown on the plan screen, checked by self-report |

For the demo, `meal_log` and `tracker_steps` come from the persona's synthetic daily and meals rows (`data/personas.json` carries summaries; the pipeline can emit the full rows per persona).

## Day and week status

```
status(day) = red   if any thresholds.daily.red_if true
            = amber if any thresholds.daily.amber_if true
            = green otherwise
status(week) = same over thresholds.weekly
```

Amber shows a nudge in Daily Grumble. Daily red notifies the coach (coach view badge). Weekly red puts the person at the top of the coach's call list.

## What the graph is not

It is not a diet. It has no "forbidden" list. The founder's example has an `avoid` field on restaurant entries because that is what he wrote; the UI renders those as "skip" inside an order, never as a standalone rule.
