// The scripted intake, one question per screen (03 §Scripted mode). Copy lives in i18n under intake.q.*.
import type { IntakeAnswers } from './rules'

export type StepType =
  | 'lang' | 'say' | 'choice' | 'yesno' | 'text' | 'number' | 'sleep' | 'cancer' | 'list' | 'meal' | 'slider'
  | 'proposals' | 'procedures' | 'rotation' | 'done'

export interface Step {
  id: string
  stage: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  type: StepType
  field?: keyof IntakeAnswers
  options?: string[]                  // choice values; labels at intake.opt.<id>.<value>
  suggestions?: string[]              // quick picks that are names (venues), shown as-is
  suggestionsKey?: string             // quick picks that translate: an array at intake.sugg.<key>
  min?: number
  max?: number
  step?: number
  start?: number                      // where a slider sits before it's touched; Next keeps it, Skip leaves it absent
  required?: boolean
  when?: (a: IntakeAnswers) => boolean
}

const VENUES = ['Versailles', 'La Carreta', 'Pollo Tropical', 'Chipotle', 'Cava', 'Pho', 'Chef Creole', 'Le Chic', 'El Palacio de los Jugos', 'Publix hot bar']

export const STEPS: Step[] = [
  // Stage 0 — language and the character
  { id: 'lang', stage: 0, type: 'lang', required: true },
  { id: 'intro', stage: 0, type: 'say' },

  // Stage 1 — who you are
  { id: 'name', stage: 1, type: 'text', field: 'name' },
  { id: 'age', stage: 1, type: 'number', field: 'age', min: 18, max: 110, step: 1 },
  { id: 'sex', stage: 1, type: 'choice', field: 'sex', options: ['female', 'male', 'other'] },
  { id: 'sleep', stage: 1, type: 'sleep', required: true },
  { id: 'work', stage: 1, type: 'choice', field: 'work', options: ['day job', 'night shift', 'works from home', 'retired', 'not working'], required: true },
  { id: 'dog', stage: 1, type: 'yesno', field: 'has_dog' },
  { id: 'sugar', stage: 1, type: 'choice', field: 'sugar', options: ['normal', 'prediabetes', 'type 2 diabetes', 'unsure'], required: true },
  { id: 'cgm', stage: 1, type: 'yesno', field: 'cgm' },
  { id: 'cancer', stage: 1, type: 'cancer' },

  // Stage 2 — the four risks: taste, convenience, money, company (company last)
  // Taste opens with one meal in their own words; Claude splits it into parts and a meal type (server/api/log.post.ts).
  { id: 'meal', stage: 2, type: 'meal' },
  { id: 'refuses', stage: 2, type: 'list', field: 'refuses' },
  { id: 'grew_up_on', stage: 2, type: 'text', field: 'grew_up_on' },
  { id: 'appetite', stage: 2, type: 'choice', field: 'appetite', options: ['steady', 'low', 'cycles'] },
  { id: 'meals_out', stage: 2, type: 'number', field: 'meals_out', min: 0, max: 21, step: 1 },
  { id: 'places', stage: 2, type: 'list', field: 'places', suggestions: VENUES, when: a => a.meals_out !== 0 },
  { id: 'cooks_days', stage: 2, type: 'number', field: 'cooks_days', min: 0, max: 7, step: 1 },
  { id: 'budget', stage: 2, type: 'slider', field: 'budget', min: 30, max: 300, step: 5, start: 90 },
  { id: 'snap', stage: 2, type: 'yesno', field: 'snap' },
  { id: 'who_cooks', stage: 2, type: 'choice', field: 'who_cooks', options: ['self', 'someone else', 'nobody'] },
  { id: 'store', stage: 2, type: 'text', field: 'store' },
  { id: 'dinner_company', stage: 2, type: 'choice', field: 'dinner_company', options: ['alone', 'partner', 'family', 'friends', 'varies'] },
  { id: 'eats_with', stage: 2, type: 'list', field: 'eats_with', suggestionsKey: 'eats_with' },
  { id: 'call', stage: 2, type: 'text', field: 'call' },
  { id: 'table', stage: 2, type: 'yesno', field: 'open_to_table' },
  { id: 'host', stage: 2, type: 'yesno', field: 'open_to_hosting' },

  // Stage 3 — what a good day is
  { id: 'proposals', stage: 3, type: 'proposals' },
  // Stage 4 — what gets checked
  { id: 'procedures', stage: 4, type: 'procedures' },
  // Stage 5 — who shows up
  { id: 'buddy', stage: 5, type: 'text', field: 'buddy' },
  { id: 'dog_name', stage: 5, type: 'text', field: 'dog', when: a => a.has_dog === true },
  // Stage 6 — your rotation
  { id: 'rotation', stage: 6, type: 'rotation', when: a => a.loves.length > 0 },
  // Stage 7 — the contract
  { id: 'framing', stage: 7, type: 'choice', field: 'framing', options: ['suggestive', 'direct'] },
  { id: 'never_mention', stage: 7, type: 'list', field: 'never_mention', suggestionsKey: 'never_mention' },

  { id: 'done', stage: 7, type: 'done' },
]

// Sections a later run can reopen from the summary (progressive intake). Language and intro aren't reopened:
// the header pill changes language.
export const SECTIONS: Record<string, string[]> = {
  you: ['name', 'age', 'sex', 'sleep', 'work', 'dog', 'sugar', 'cgm', 'cancer'],
  food: ['refuses', 'grew_up_on', 'appetite'],
  week: ['meals_out', 'places', 'cooks_days', 'budget', 'snap', 'who_cooks', 'store'],
  people: ['dinner_company', 'eats_with', 'call', 'table', 'host', 'buddy', 'dog_name'],
  goodday: ['proposals', 'procedures'],
  dishes: ['rotation'],
  talk: ['framing', 'never_mention'],
}
