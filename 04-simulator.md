# 04 — What-if simulator

The screen that answers the challenge. Pick a dish, pick a time, pick a walk. See what happened to people like you.

## Screen

```
┌──────────────────────────────────────────────────────┐
│  What if…                                             │
│  [ Vaca frita with rice and black beans ▾ ]           │
│  at  [ 7:00 pm ───●──────── 10:00 pm ]                │
│  then  ( no walk ) ( 10 min walk ) ( 20 min )         │
│                                                       │
│   mg/dL                                               │
│   200 ┤                                               │
│       │        ╭──╮   ← 9:30 pm, no walk              │
│   150 ┤      ╭─╯  ╰──╮                                │
│       │    ╭─╯ ╭─╮   ╰──╮                             │
│   100 ┤────╯───╯ ╰─────╰────── ← 7 pm, 10-min walk    │
│       └────┬────┬────┬────┬────                       │
│           0   30   60  120  180 min                   │
│                                                       │
│  Peak: 207 vs 143 mg/dL   Over 2 h: −75%              │
│  "People like you (prediabetes, n=5,472 dinners)"     │
│                                                       │
│  [ Same plate, the move: beans first, one cup rice ]  │
└──────────────────────────────────────────────────────┘
```

Two curves always: the person's current choice (from their log or the sliders) and Grumble's move. The move is the default comparison; the user can drag the sliders to build any comparison.

Below the chart, three stat tiles that never change layout: **Peak**, **Over 2 hours** (iAUC as a percentage of the baseline choice), **Back to baseline by** (minutes). Beneath them the one-line move for this dish from the food graph (or the moves vocabulary if the dish isn't in the rotation).

Title the band "People like you" with the blood sugar group and the n of dinners it is drawn from. The curve is a band (p25–p75 shading around the mean), never a single line, and never the word "predict".

## The math

All constants live in `data/simulator-params.json`. Nothing here is hardcoded in the component.

### Inputs

- `dish`: a row from `dishes.json` (carbs_g, fiber_g, protein_g, fat_g), optionally scaled by a portion factor from the move (e.g. half rice → carbs × 0.65 for a rice plate; see portion rules below).
- `time`: clock time, resolved to `late` = true when `time ≥ sleep_start − 3.5 h` (for the demo: ≥ 20:00 for anyone whose sleep_start ≥ 23:00; for night shift, relative). This matches how `late` was defined in the fit (≥ 20:00 or < 04:00 for day sleepers).
- `walk_min`: 0, 10, 20.
- `group`: `person.blood_sugar_group`.

### Peak delta (mg/dL above baseline)

From the OLS in `ols_peak_delta_mg_dl` (r² 0.37, n = 21,231 meals):

```
peak_delta = intercept
           + per_g_carbs   * carbs_g
           + per_g_fiber   * fiber_g
           + per_g_protein * protein_g
           + per_g_fat     * fat_g
           + late_dinner_flag * late
           + per_min_walk_capped_30 * min(walk_min, 30)
           + prediabetes * [group == prediabetes]
           + type_2_diabetes * [group == type 2 diabetes]
           + per_mg_dl_baseline * baseline
baseline   = baseline_mg_dl[group]
```

With the fitted values: `27.55 + 0.576·carbs − 0.725·fiber − 0.136·protein + 0.008·fat + 14.67·late − 0.71·min(walk,30) + 20.40·pre + 38.71·t2d − 0.184·baseline`.

**Walk saturation.** The linear walk term understates the step at 0→10 and overstates 10→30. For the displayed numbers, replace the linear term with the group-stratified dinner effect: `walk_peak_delta[group] × min(walk_min, 10) / 10`. The dose-response table in the params file (`walk_dose_response_dinner_peak`: 64.8 → 42.1 → 45.6 → 46.6 for 0 / ≤10 / ≤20 / >20 min) is the evidence that 10 minutes is the whole effect. The stat tile for 20 min shows the same number as 10 min with the note "same as ten".

**Late dinner.** Likewise prefer the group-stratified `late_dinner_peak_delta[group]` (+13.4 / +24.4 / +31.4) over the pooled 14.67 when the meal is dinner. Use the pooled coefficient for other meal types.

### Curve shape

```
curve(t) = baseline + peak_delta × shape(t × 60 / time_to_peak_min[group])
```

`shape` is piecewise linear through `shape_fraction_of_peak` (0 → 0, 30 → 0.622, 60 → 0.786, 90 → 0.549, 120 → 0.301, 180 → 0.07, 240 → 0), stretched so its peak lands at the group's `time_to_peak_min` (59 / 72 / 87). Note the empirical shape peaks at 60 in the 15-minute grid; the 0.786 at 60 is the mean fraction, which is why the stretch is by time-to-peak, not by a fixed 60.

Band: ±25% of `peak_delta` for the shading. (A proper p25/p75 by carbs band is available from `analysis/meal_responses.csv` if there is time; the pipeline can emit it as `band_by_carbs_band`.)

### Over-2-hours tile

```
iauc = ∫₀¹²⁰ max(curve(t) − baseline, 0) dt
```

Report the move's iAUC as a percentage change versus the current choice. Cross-check against `ols_iauc_2h` for sanity; the displayed number is from the drawn curve so the chart and the tile never disagree.

### Portion rules for moves

| Move | Effect on inputs |
|---|---|
| half the rice / one cup not two | carbs × 0.65, calories × 0.8 (rice plates); carbs × 0.75 for plantain plates |
| beans first / protein first | fiber × 1.0, but apply `per_g_fiber` at 1.5× (order effect; the data has no order variable, this is the one assumption and it is labeled in the UI as "order effect, estimated") |
| add a side of black beans | fiber + 8, protein + 7, carbs + 20 |
| two maduros not four | carbs − 25, calories − 110 |
| morning not night | late = false |
| 10-minute walk | walk_min = 10 |

Keep this table in `src/sim/moves.ts` and show the applied rule in a tooltip on the move tile.

## Edge cases

- Dish not in `dishes.json`: show "I don't have numbers for that one yet. Closest I have: {3 nearest by name in the same cuisine}."
- Night shift: the time slider is labeled in hours before sleep ("4 h before bed"), and `late` resolves from that. Jean at 02:00 with sleep at 09:00 is not late.
- Normal glucose group: the band is lower and the copy says "even for you" rather than implying risk.
- Walk slider at 20 and 30: same displayed numbers as 10 with "same as ten". This is the "how much is enough" answer and it should be visible, not hidden.

## Tests

- `simulator.test.ts`: for Marisol (prediabetes), vaca frita (85.6 g carbs, 11.7 g fiber, 38.9 g protein, 25.3 g fat) at 21:30 with no walk vs 19:00 with a 10-min walk, same plate: peak delta 85.8 vs 38.8 mg/dL (difference 47.0), iAUC −55%. With the one-cup move (carbs × 0.65) added: peak delta 21.6, iAUC −75%. These are the hand computation from `simulator-params.json` using the group-stratified late and walk effects; assert within ±1 mg/dL.
- Shape integrates to a positive iAUC and returns to baseline by 240 min.
- Changing walk from 10 to 20 changes nothing displayed.
- Jean fixture: 02:00 is not late; 06:00 (3 h before his 09:00 sleep) is.
