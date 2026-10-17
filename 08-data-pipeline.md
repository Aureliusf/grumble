# 08 — Data pipeline

Everything in `data/` was produced by the scripts in `analysis/` from the challenge data. This file says how, so the build can regenerate or extend it. Run every script with `python3 -I script.py <args>`; pandas and numpy are the only dependencies.

Expected layout, one level above this spec directory:

```
challenge-data/
├── nhanes_us_adults.csv
├── synthetic_data/
│   ├── synthetic_participants.csv
│   ├── synthetic_checkups_week0_week12.csv
│   ├── synthetic_daily.csv
│   ├── synthetic_meals.csv
│   ├── synthetic_glucose_every_15_min.csv
│   └── synthetic_100_people.json
└── CGMacros/                 (not used by the current scripts; see "CGMacros" below)
```

## Scripts

| Script | Input | Output | Runtime |
|---|---|---|---|
| `nhanes_pass.py nhanes_us_adults.csv` | NHANES | stdout tables: survivors vs not, PHQ-9 bands, income bands, fast bands, movement quartiles, evening-calorie bands, Spearman vs HbA1c | 5 s |
| `nhanes_phq.py nhanes_us_adults.csv` | NHANES | stdout: the full PHQ-9 gradient table used in `12` | 5 s |
| `synth_pass.py synthetic_data/` | synthetic | stdout: group effects wk0→12, dropout by group/work/dog/language, daily behavior by group, Spearman of behaviors vs ΔHbA1c, fast-hours bands, night-shift interaction, holidays, mood vs eating, cuisines | 60 s |
| `cgm_model.py synthetic_data/` | synthetic glucose + meals + participants | `meal_responses.csv` (one row per meal with CGM coverage: baseline, 30/60/90/120/180-min deltas, peak, time to peak, 2 h iAUC), `cgm_summary.json`, stdout: OLS fits, late/walk effects by group, walk dose-response | 3 min |
| `assets.py synthetic_data/` | synthetic meals + participants + checkups + daily | `dishes.json`, `personas.json` | 60 s |
| (inline in the session; fold into `assets.py`) | `meal_responses.csv` | `simulator-params.json` | 1 s |

## How each data file was made

**`dishes.json`** — group `synthetic_meals.csv` by (food, cuisine); median of calories, carbs, protein, fat, fiber, sugar; `mediterranean_style` = majority vote; `typical_meal_type` = modal meal_type; `logged_count` = rows. 127 dishes. `grumble_move` is null and is filled by the moves vocabulary at runtime (`09`); a hand-written move for the top 30 dishes is a good hour's work if someone has it.

**`personas.json`** — four real synthetic participants chosen by query (see `10-personas.md`), with their participant row, both check-ups, a daily summary (mean steps, % days with an after-dinner walk, mean overnight fast, mean evening-calorie %, modal last-ate time, mean healthy-eating score, mean energy) and their eight most-logged dishes. Extend it with full `daily` and `meals` rows per persona for the demo log (`assets.py`, add a flag).

**`simulator-params.json`** — from `cgm_model.py`. For each of 21,231 meals by the 500 sensored participants: baseline = last reading at or before the meal; deltas at 30/60/90/120/180 min (nearest reading within 10 min); peak and time to peak over 0–180; iAUC = trapezoid of positive deltas over 0–120. OLS of peak, iAUC and the 120-min delta on carbs, fiber, protein, fat, a late flag (meal ≥ 20:00 or < 04:00), walk minutes capped at 30, group dummies and baseline. Dinner-only late and walk effects by group are simple means. Walk dose-response is dinner peak by walk band.

**`meal_responses.csv`** — the per-meal table above; 21,231 rows. Use it to compute real p25/p75 bands by carbs band and group for the simulator shading.

**`cgm_summary.json`** — mean curve shape and group means; a subset of the params file.

## CGMacros (real data, not yet used)

The scripts do not read CGMacros because it was not in the working copy. When it is: `cgmacros_minute_by_minute.csv` has glucose every minute with meals marked on the start minute and Fitbit METs. Run the same per-meal extraction (`cgm_model.py` logic, 1-minute grid, Libre column) over its 45 people and compare the curve shape and the carbs coefficient to the synthetic fit. Report both in `12-evidence-pack.md` as "synthetic (planted) vs real (CGMacros)". It is the sanity check the pitch should mention: the synthetic shape peaking at 60–90 min and returning by 180 is what real CGM traces do.

## NHANES weighting

All NHANES figures are unweighted medians. To weight the headline PHQ-9 table: use `survey_weight_exam` for BMI and movement, `survey_weight_diet_2day` for meal-timing and intake columns, `survey_weight_fasting_lab` for fasting glucose. HbA1c is from the exam sample (`survey_weight_exam`). Weighted medians change the numbers slightly, not the gradient. Do it if there is an hour; say "unweighted" on the slide if not.

## Regeneration

```
cd specs/analysis
python3 -I cgm_model.py ../../challenge-data/synthetic_data      # ~3 min
python3 -I assets.py    ../../challenge-data/synthetic_data      # ~1 min
# then the params block in assets.py (or the inline snippet in the session) writes ../data/simulator-params.json
```

Paths inside the scripts write to `data/` relative to the repo root used in the session (`data/meal_responses.csv` etc.); adjust the output paths to `specs/data/` when folding into the repo.
