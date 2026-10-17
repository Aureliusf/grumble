// Daily targets the day is balanced against. Published guidance, computed in code:
// - Calories: Dietary Guidelines for Americans 2020–2025, Appendix 2 (estimated calorie needs, sedentary).
// - Carbohydrate 45% of calories (the low end of the DGA 45–65% range).
// - Protein 20% of calories (inside the DGA 10–35% range).
// - Fiber 14 g per 1,000 kcal (DGA).
// Weight is never asked (contract.never_mention), so targets come from age and sex only.

export type Sex = 'female' | 'male' | 'other'

// sugar_g is optional: the glucose model (simulate.ts) does not use it; meals and dishes carry it for display.
export interface Nutrients { calories: number; carbs_g: number; fiber_g: number; protein_g: number; fat_g: number; sugar_g?: number }
export interface Targets { calories: number; carbs_g: number; fiber_g: number; protein_g: number }

// [minimum age, kcal] bands, sedentary.
const DGA_FEMALE: [number, number][] = [[19, 2000], [26, 1800], [51, 1600]]
const DGA_MALE: [number, number][] = [[19, 2600], [21, 2400], [41, 2200], [61, 2000]]

const band = (table: [number, number][], age: number) =>
  table.reduce((kcal, [min, k]) => (age >= min ? k : kcal), table[0]![1])

// A skipped age uses 55 (the program is survivors after treatment); a skipped or "other" sex averages the two tables.
export function dailyTargets(age?: number, sex?: Sex): Targets {
  const a = age ?? 55
  const kcal = sex === 'female'
    ? band(DGA_FEMALE, a)
    : sex === 'male'
      ? band(DGA_MALE, a)
      : Math.round((band(DGA_FEMALE, a) + band(DGA_MALE, a)) / 200) * 100
  return {
    calories: kcal,
    carbs_g: Math.round((kcal * 0.45) / 4),
    protein_g: Math.round((kcal * 0.20) / 4),
    fiber_g: Math.round((kcal / 1000) * 14),
  }
}

export const scale = (n: Nutrients, f: number): Nutrients => ({
  calories: n.calories * f, carbs_g: n.carbs_g * f, fiber_g: n.fiber_g * f, protein_g: n.protein_g * f, fat_g: n.fat_g * f,
  sugar_g: (n.sugar_g ?? 0) * f,
})

export const sum = (xs: Nutrients[]): Nutrients => xs.reduce((a, b) => ({
  calories: a.calories + b.calories, carbs_g: a.carbs_g + b.carbs_g, fiber_g: a.fiber_g + b.fiber_g,
  protein_g: a.protein_g + b.protein_g, fat_g: a.fat_g + b.fat_g, sugar_g: (a.sugar_g ?? 0) + (b.sugar_g ?? 0),
}), { calories: 0, carbs_g: 0, fiber_g: 0, protein_g: 0, fat_g: 0, sugar_g: 0 })
