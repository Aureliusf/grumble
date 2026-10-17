// Precompute every dish's parts into data/dish-components.json, so the next-meal card never waits on Claude.
// Needs the app running with ANTHROPIC_API_KEY: `npm run dev`, then `node data/scripts/build-dish-components.mjs [base-url]`.
// Re-running keeps what's already in the file and only fills the gaps. Restart the dev server afterwards.
import { readFileSync, writeFileSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:3000'
const out = new URL('../dish-components.json', import.meta.url)
const file = JSON.parse(readFileSync(out, 'utf8'))
const dishes = JSON.parse(readFileSync(new URL('../dishes.json', import.meta.url), 'utf8')).dishes
const todo = dishes.filter(d => !file.dishes[d.id])

let done = 0
async function one(d) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${base}/api/recipe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dish_id: d.id }) })
    if (res.ok) {
      file.dishes[d.id] = (await res.json()).parts
      console.log(`${++done}/${todo.length} ${d.id}`)
      return
    }
    await new Promise(r => setTimeout(r, 1500 * attempt))
  }
  console.log(`FAILED ${d.id}`)
}

const queue = [...todo]
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await one(queue.shift()) }))
file.dishes = Object.fromEntries(Object.entries(file.dishes).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(out, JSON.stringify(file, null, 1) + '\n')
console.log(`wrote ${Object.keys(file.dishes).length} of ${dishes.length} dishes`)
