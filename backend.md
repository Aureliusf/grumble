# Backend ideas for Grumbl

This is a planning document for what the backend should support. It is not an implementation spec and does not include code.

## Product goal

Grumbl should help people understand how meals, meal timing, movement, glucose, and broader health markers relate to each other. The backend should turn logged data into practical, culturally familiar suggestions people can follow.

The app should be especially useful for Miami communities. Advice should preserve familiar foods where possible instead of replacing them with generic health food.

## Core principles

- Keep observed data, user-entered data, AI-estimated data, and recommendations separate.
- Treat food culture as part of the model, not a label added later.
- Prefer small practical actions over strict diet prescriptions.
- Avoid claiming causation when the data only supports observed patterns.
- Do not pretend the backend knows exact portions from a photo unless the user confirms them.
- Every recommendation should explain why it was shown and what kind of evidence supports it.

## Users and profiles

The backend should support user profiles with:

- age
- sex
- preferred language
- race or ethnicity when voluntarily provided
- food background
- cancer history
- years since treatment
- blood sugar group
- height, weight, BMI, and waist when available
- work schedule
- glucose sensor status
- program participation status

Food background should help shape recommendations. A Cuban user and a Haitian user may get the same high-level nutrition goal, but the suggested foods should sound different.

## Meal tracking

The backend should support meals with:

- meal time
- eating day
- meal type
- food name or description
- cuisine
- cuisine family
- meal photo
- calories
- carbs
- protein
- fat
- fiber
- sugar
- Mediterranean-style or other pattern score when available
- whether the meal was manually logged, imported, AI-estimated, or coach-entered

The backend should allow incomplete meal records. A user may only upload a photo, type “rice and chicken,” or confirm a few recognized components.

## Meal photos and recognition

The backend should eventually support uploaded meal photos, but photo analysis should remain separate from confirmed meal data.

For a photo, store or track:

- image reference
- recognized food candidates
- recognized meal components
- cuisine guess
- confidence scores
- source of recognition
- user confirmations or corrections

The backend should not treat AI recognition as truth. The user should be able to confirm or fix recognized items.

## Meal components

For recommendations, the backend should support broad meal components instead of exact ingredient portions.

Useful component categories:

- starchy base
- protein
- vegetables
- beans and legumes
- fruit
- sweet drink
- dessert
- fried item
- sauce
- alcohol

Examples:

- rice, arepa, yuca, plantain, pasta, and bread can map to starchy base
- chicken, fish, pork, beef, eggs, and tofu can map to protein
- black beans, red beans, lentils, and chickpeas can map to beans and legumes
- soda, sweet tea, juice, and sweet cafe drinks can map to sweet drink

This supports advice like “go lighter on rice” or “add beans or vegetables” without pretending to know exact grams from a photo.

## Cuisine families

The backend should support cuisine families and culturally familiar swaps.

Initial cuisine families for Miami:

- Cuban
- Haitian
- Colombian
- Venezuelan
- Dominican
- Puerto Rican
- Jamaican
- Central American
- Southern
- everyday US
- Caribbean
- Latin American

Cuisines should be allowed to belong to more than one family. For example, Dominican and Puerto Rican food can be both Caribbean and Latin American.

The backend should support:

- cuisine family lookup
- common foods by cuisine
- aliases in English, Spanish, and Haitian Creole where possible
- culturally familiar component suggestions
- cuisine-aware recommendation wording

## Portion and component changes

The backend should support compromise-style recommendations:

- reduce a recognized component
- increase a recognized component
- swap a component
- keep the dish but adjust the plate

Examples:

- reduce starchy base
- increase beans and legumes
- increase vegetables
- reduce sweet drink
- reduce fried item
- keep the protein, change the side

The backend should avoid exact instructions like “eat 0.75 cups of rice” unless the user entered or confirmed the portion.

Better wording:

- “Go lighter on the rice or plantains.”
- “Add black beans or salad if they fit the meal.”
- “Keep the arroz con pollo, but shift the plate toward more protein and vegetables.”
- “If this is a late dinner, make the starchy side smaller.”

## Nutrient estimates

The backend should support nutrient estimates from multiple sources:

- dataset labels
- user entry
- barcode or food database
- AI estimate
- coach entry
- corrected user confirmation

Each estimate should track confidence and source.

The app should be able to compare current nutrients to an adjusted version, but that comparison should be labeled as an estimate.

## Glucose data

The backend should support glucose readings from sensors and derived meal responses.

For readings:

- timestamp
- glucose value
- sensor type
- source
- quality flags

For meal response:

- pre-meal baseline
- peak glucose rise
- time to peak
- positive incremental glucose area
- net glucose area
- two-hour response window
- nearby meals
- quality flags

The backend should preserve sensor identity. Different sensors may disagree.

## Movement and activity

The backend should support activity near meals and across days.

Meal-level movement:

- walked after meal minutes
- steps after meal
- activity during the glucose response window
- pre-meal activity

Daily movement:

- steps
- active minutes
- post-dinner walking
- heart rate
- resting heart rate

Recommendations can use this for small actions like walking after higher-carb meals.

## Meal timing

The backend should support:

- first eating time
- last eating time
- eating window
- overnight fast
- evening calories percent
- late meals and late snacks
- night-shift context

Night-shift workers need special handling. A long overnight fast may mean something different for them.

## Daily logs and check-ins

The backend should support daily context:

- sleep minutes
- sleep efficiency
- bedtime
- energy
- hunger
- alcohol drinks
- weight
- food logging status
- missed logs

This lets Grumbl connect food advice to daily life instead of only looking at macros.

## Health markers and progress

The backend should support health markers over time:

- weight
- waist
- BMI
- HbA1c
- fasting glucose
- fasting insulin
- triglycerides
- HDL
- CRP
- blood pressure
- fatigue score
- six-minute walk distance

The backend should be clear about which markers are real observed data and which come from synthetic program data.

## Program and coaching support

The backend should support behavior-change programs:

- program enrollment
- group assignment
- coach assignment
- goals
- checkups
- adherence markers
- coaching sessions
- coach notes
- user-facing action plan

The coaching layer should focus on practical next steps, not diagnosis.

## Recommendations

The backend should support recommendation objects with:

- recommendation type
- title
- plain-language suggestion
- reason
- evidence level
- confidence
- related meal or daily pattern
- related cuisine family
- action type
- safety flags

Recommendation types:

- component shift
- portion adjustment
- food swap
- meal timing
- post-meal movement
- logging reminder
- coach follow-up
- community prompt

Evidence levels:

- rule based
- observed pattern
- similar meal match
- AI generated
- coach reviewed
- clinician reviewed

The app should prefer rule-based and observed-pattern advice for the first version.

## Similar meal matching

The backend should support matching a meal to similar observed meals using:

- carbs
- protein
- fat
- fiber
- meal type
- cuisine when available
- person context when appropriate
- glucose response availability

Matches should be framed as examples, not predictions.

Good wording:

- “Similar meals in this dataset had lower glucose rises.”
- “This is an observed comparison, not a guaranteed result for you.”

## Cuisine-aware swaps

The backend should support a curated swap library.

Example Cuban suggestions:

- lighter rice portion
- add black beans or salad
- choose unsweetened or smaller cafe con leche
- keep the protein, reduce extra starchy sides

Example Haitian suggestions:

- more legim
- lighter diri portion
- baked or air-fried plantains sometimes
- add beans or vegetables when possible

Example Colombian suggestions:

- choose one main starch instead of rice plus arepa plus plantain
- add beans, avocado, or salad
- pair empanadas with soup or salad

Example Jamaican suggestions:

- keep jerk chicken, add cabbage or vegetables
- smaller rice and peas portion when glucose spikes are common
- choose fewer patties or smaller portions

These should be stored as content that product and nutrition reviewers can edit without changing recommendation logic.

## AI support

AI should assist the backend, not replace the source of truth.

Good AI uses:

- food recognition from photos
- cuisine detection
- ingredient or component guesses
- portion uncertainty prompts
- plain-language summaries
- Spanish and Haitian Creole translations
- weekly pattern summaries for coaches

Risky AI uses:

- unreviewed medical advice
- exact portion estimation from photo alone
- cancer outcome claims
- diabetes treatment recommendations
- medication or clinical nutrition guidance without proper data

The backend should keep AI outputs labeled and reviewable.

## Community and human contact

The backend should support community features that align with food culture and behavior change:

- groups
- posts
- comments
- reactions
- meal shares
- support circles
- accountability partners
- coach messages
- moderation flags

Community recommendations can be simple:

- share a meal win
- ask your group for lower-sugar cafe ideas
- join a walking challenge
- discuss a culturally familiar swap

## Safety and claims

The backend should avoid unsupported medical claims.

Do not claim:

- this food causes better cancer outcomes
- this recommendation treats diabetes
- this photo predicts HbA1c
- this swap guarantees a glucose reduction

Safer language:

- “This pattern was followed by a higher glucose rise.”
- “Similar meals had lower observed responses.”
- “This is a small change that may help reduce fast-carb load.”
- “Ask your care team if you have medical restrictions.”

## Backend capabilities by phase

### Phase 1: Hackathon demo

Support:

- participants
- meals
- meal photos
- glucose windows
- similar meal matching
- meal component recognition from food text
- cuisine family lookup
- rule-based component suggestions
- post-meal walk suggestions
- late-meal suggestions
- recommendation evidence labels

### Phase 2: Better product demo

Support:

- uploaded meal photos
- AI-recognized components
- user confirmation flow
- daily and weekly summaries
- synthetic program progress views
- curated cuisine swap library
- coach dashboard data
- basic community meal sharing

### Phase 3: Real-world pilot

Support:

- wearable integrations
- food database integration
- serving-size confirmation
- multilingual content
- clinician or dietitian review workflow
- stronger safety flags
- model evaluation tracking
- consent and privacy controls

### Phase 4: Clinical-grade product

Support:

- validated recommendation protocols
- clinical review
- medication and condition-aware constraints
- integration with care teams
- real longitudinal outcomes
- regulatory and privacy review

## Open questions

- Which cuisine families are most important for the first demo?
- Should the first recommendation engine use only rules, or rules plus similar-meal matching?
- Do we want Spanish and Haitian Creole copy in the first version?
- Should community features appear in the demo, or only coaching and meal advice?
- Will users select cuisine manually, or should the backend infer it from food names first?
- How much clinical review do we need before showing advice to real users?
