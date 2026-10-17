# 07 — Coach view

The Sylvester coach's screen. Who to call first, and why, before the week-12 visit. It is the Attestify "continuous, whole-population verification" idea on a survivorship program: the slide shows in week 4, not week 12.

## The call list

A table, sorted by urgency, one row per person. Columns: name, week in program, status (red / amber / green for this week), the reason in plain words, last contact, a "Call" button that logs the call.

Reason strings come straight from `thresholds.weekly` evaluation, in coach language:

| Threshold hit | Reason shown |
|---|---|
| no log 3 consecutive days | "Gone quiet since Thursday" |
| mood ≤ 2 on 3 days | "Three low days this week" |
| cgm time above 180 > 25% | "A quarter of the week over 180" |
| dinner-by-8 missed 3+ days | "Dinner after 8 most nights" |
| walk-10 missed 4+ days | "Hasn't walked after dinner since Sunday" |
| `open_to_table` and never attended by week 3 | "Said yes to the table, hasn't come" |
| night shift | badge "night shift — timing is relative to sleep" on the row, always |

Demo data: the four personas plus 46 more rows generated from `synthetic_participants.csv` sensored participants with their real weekly aggregates (the pipeline emits `coach-rows.json`).

## The program at a glance

Above the list, four tiles and one chart, all from the synthetic aggregates in `12-evidence-pack.md`:

- **Walked after dinner this week**: % of people with ≥ 4 days (program: mean 7.3–7.7 min/day in the coaching arms vs 3.9 for tips; 29% of all logged dinners were followed by a walk).
- **Dinner before 8**: % of people, with the night-shift group excluded and noted.
- **Logging**: % who logged ≥ 5 days.
- **Red this week**: count.

Chart: HbA1c change by arm (−0.06 / −0.22 / −0.26) as three bars, with the type-2-diabetes subgroup (−0.12 / −0.44 / −0.52) as a toggle. This is the "coaching works" slide, live in the product.

## The planted patterns, as prompts

A panel titled "What the data says this week" with three fixed prompts the coach can use on calls. These are static in the demo and sourced from `12`:

1. "The walk matters more than the steps. Someone at 4,000 steps who walks ten minutes after dinner is doing better than someone at 9,000 who doesn't." (ρ = −0.26 vs +0.12)
2. "Night shift gets nothing from the overnight fast and drops out at twice the rate. Ask about sleep, not dinner time." (69% vs 85% finish)
3. "Evening calories, not total calories. The fast arm went from 22% to 13% after 8 pm and that's most of the difference." (ρ = +0.22)

## Person drawer

Click a row → the person's food graph rendered read-only (same component as the plan screen), their last 7 days as a strip (status dots, dinner time, walk minutes, mood), and the simulator pre-loaded with their starred dinner. Coach can add a note (`log.coach_notes[]`) and change `accountable.coach`.

## Permissions (demo)

A toggle in the header switches between "person" and "coach" views. No auth in the build. Note in the UI that the coach view would sit behind Sylvester's login.

## Tests

- Marisol in week 4 with three mood-2 days → top of the list, reason "Three low days this week".
- Jean's row carries the night-shift badge and his dinner-by-8 reason never fires.
- Sorting: red before amber before green; within red, most recent threshold hit first.
