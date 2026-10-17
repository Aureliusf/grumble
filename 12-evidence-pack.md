# 12 — Evidence pack

Four charts for the pitch, with their numbers and provenance. All from `analysis/` scripts on the challenge data, 2026-10-17. Build them with the data in this file; do not re-estimate in the deck.

## Chart 1 — The real-data hypothesis: distress, money and glucose among US cancer survivors

NHANES 2011–2014, 808 cancer survivors, unweighted medians (`nhanes_phq.py`). The gradient is in survivors and barely in non-survivors (HbA1c 5.5 → 5.6).

| PHQ-9 band | n | HbA1c % | Fasting glucose | BMI | Diabetes dx | Calories/day | Fiber g | Sleep h | Income (× poverty) | Health poor/fair |
|---|---|---|---|---|---|---|---|---|---|---|
| 0–4 none | 493 | 5.7 | 103 | 27.7 | 22% | 1,781 | 15.4 | 7 | 2.58 | 22% |
| 5–9 mild | 117 | 5.7 | 106 | 29.6 | 24% | 1,685 | 14.5 | 7 | 1.90 | 43% |
| 10–14 moderate | 45 | 5.9 | 109 | 28.6 | 27% | 1,571 | 14.0 | 6 | 1.26 | 58% |
| 15+ severe | 42 | 5.9 | 109 | 32.0 | 45% | 1,414 | 10.9 | 6 | 1.08 | 83% |

Draw as: four grouped bars (HbA1c, fiber, income, % diabetes) or a slope chart from "none" to "severe". The headline: the most distressed survivors eat **less**, not more, and the fiber collapses. Say "unweighted, observational, no loneliness item; PHQ-9 and income are the proxies."

Supporting: movement quartiles among survivors — least active 6,900 MIMS/day, HbA1c 5.9, 47% died by 2019; most active 15,900, HbA1c 5.6, 12% died. Age confounds (76 vs 60).

## Chart 2 — The program worked, and the relationship did the work

Synthetic 12-week program, randomized arms, mean change week 0 → 12 among finishers (`synth_pass.py`).

| Arm | n finished | ΔHbA1c | ΔWeight kg | ΔFasting glucose | ΔTriglycerides | Δ6-min walk m | ΔFatigue (higher = more energy) |
|---|---|---|---|---|---|---|---|
| Tips by email | 566 | −0.06 | −0.36 | −1.0 | +3.7 | +13 | +2.2 |
| Coaching | 568 | −0.22 | −1.49 | −3.8 | −7.0 | +25 | +3.0 |
| Coaching + overnight fast | 558 | −0.26 | −1.90 | −5.1 | −9.2 | +24 | +2.9 |

By baseline group, ΔHbA1c: normal −0.02 / −0.09 / −0.11; prediabetes −0.06 / −0.24 / −0.28; type 2 diabetes −0.12 / −0.44 / −0.52.

Draw as: three bars for ΔHbA1c, with the T2D subgroup as a second panel. Headline: coaching 4× tips; the fast adds a little on top.

## Chart 3 — The three answers, from the CGM

21,231 meals with glucose coverage, 500 sensored participants (`cgm_model.py`). Dinner only, by baseline group.

| Group | Dinners | Late (≥ 8 pm) adds to peak | Late: 2 h exposure | Any walk after cuts peak | Walk: 2 h exposure |
|---|---|---|---|---|---|
| Normal | — | +13 mg/dL | ×1.39 | −16 mg/dL | ×0.67 |
| Prediabetes | — | +24 mg/dL | ×1.48 | −23 mg/dL | ×0.65 |
| Type 2 diabetes | — | +31 mg/dL | ×1.59 | −25 mg/dL | ×0.65 |

Walk dose-response (dinner peak, all groups): 0 min 65 → ≤10 min 42 → ≤20 min 46 → >20 min 47 mg/dL. **Ten minutes is the whole effect.**

Pooled OLS on peak: +0.58 mg/dL per g carbohydrate, −0.73 per g fiber, −0.14 per g protein, +14.7 for a late meal, −0.71 per walk minute (to 30), +20 prediabetes, +39 T2D; r² 0.37.

Draw as: the simulator itself, live, Marisol's vaca frita at 9:30 pm no walk vs 7 pm with a 10-minute walk. Second visual: the dose-response as four bars with a flat line from 10 onward.

## Chart 4 — Who the one-size advice fails

Synthetic program (`synth_pass.py`).

- Finished the program: night shift 69%, day job 84%, works from home 85%, retired 86%, not working 89%.
- ΔHbA1c by achieved overnight fast, night shift vs day job: at 13–14 h, day job −0.22, night shift −0.10; at >14 h, day job −0.21, night shift n/a (none achieved it).
- Dog owners 8,761 steps/day vs 7,136. Retirees 6,698, the least of any schedule.
- Holidays 2,828 kcal vs 1,906 on ordinary days.
- Behavior correlates with ΔHbA1c (Spearman, per person): after-dinner walk minutes −0.26; evening-calorie share +0.22; healthy-eating score −0.18; overnight fast hours −0.18; **total steps +0.12**.

Draw as: dropout by schedule (five bars, night shift in the accent) and the correlation strip (five horizontal bars about zero). Headline: the walk, not the steps; and night shift needs sleep-relative timing.

## What the pack does not claim

- Causation in real people. Synthetic patterns are the Crane Lab's design; the README says so.
- Loneliness. Not measured; Grumble collects it.
- Anything from CGMacros yet; add the shape comparison when the data is in hand (`08`).

## Slide order

1. Chart 1 (the real problem) → 2. Chart 2 (coaching works) → 3. the simulator live (the three answers) → 4. Chart 4 (who it fails) → 5. the Versailles table (what we built instead of another chart).
