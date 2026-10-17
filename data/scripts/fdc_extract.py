import csv, json, sys, os
src, out = sys.argv[1], sys.argv[2]
WANT = [
  ("white-rice", "White rice, cooked", "Rice, white, long-grain, regular, enriched, cooked"),
  ("brown-rice", "Brown rice, cooked", "Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program)"),
  ("black-beans", "Black beans, cooked", "Beans, black, mature seeds, cooked, boiled, without salt"),
  ("red-beans", "Red kidney beans, cooked", "Beans, kidney, red, mature seeds, cooked, boiled, without salt"),
  ("pinto-beans", "Pinto beans, cooked", "Beans, pinto, mature seeds, cooked, boiled, without salt"),
  ("chickpeas", "Chickpeas, cooked", "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt"),
  ("lentils", "Lentils, cooked", "Lentils, mature seeds, cooked, boiled, without salt"),
  ("chicken-breast", "Chicken breast, roasted", "Chicken, broilers or fryers, breast, meat only, cooked, roasted"),
  ("chicken-thigh", "Chicken thigh, roasted", "Chicken, broilers or fryers, thigh, meat only, cooked, roasted"),
  ("ground-beef", "Ground beef (85% lean), cooked", "Beef, ground, 85% lean meat / 15% fat, patty, cooked, pan-broiled"),
  ("steak", "Beef steak (sirloin), broiled", "Beef, top sirloin, steak, separable lean and fat, trimmed to 1/8\" fat, all grades, cooked, broiled"),
  ("pork-loin", "Pork loin, roasted", "Pork, fresh, loin, whole, separable lean and fat, cooked, roasted"),
  ("salmon", "Salmon, cooked", "Fish, salmon, Atlantic, farmed, cooked, dry heat"),
  ("white-fish", "White fish (tilapia), cooked", "Fish, tilapia, cooked, dry heat"),
  ("shrimp", "Shrimp, cooked", "Crustaceans, shrimp, mixed species, cooked, moist heat (may contain additives to retain moisture)"),
  ("egg", "Egg, hard-boiled", "Egg, whole, cooked, hard-boiled"),
  ("egg-fried", "Egg, fried", "Egg, whole, cooked, fried"),
  ("plantain-ripe-fried", "Sweet plantains (maduros), fried", "Plantains, yellow, fried, Latino restaurant"),
  ("plantain-green-fried", "Tostones (green plantain), fried", "Plantains, green, fried"),
  ("plantain-boiled", "Plantain, boiled", "Plantains, green, boiled"),
  ("yuca", "Yuca (cassava)", "Cassava, raw"),
  ("potato", "Potato, baked", "Potatoes, baked, flesh and skin, without salt"),
  ("sweet-potato", "Sweet potato, baked", "Sweet potato, cooked, baked in skin, flesh, without salt"),
  ("french-fries", "French fries", "Fast foods, potato, french fried in vegetable oil"),
  ("broccoli", "Broccoli, cooked", "Broccoli, cooked, boiled, drained, without salt"),
  ("mixed-vegetables", "Mixed vegetables, cooked", "Vegetables, mixed, frozen, cooked, boiled, drained, without salt"),
  ("lettuce", "Lettuce / salad greens", "Lettuce, cos or romaine, raw"),
  ("tomato", "Tomato", "Tomatoes, red, ripe, raw, year round average"),
  ("avocado", "Avocado", "Avocados, raw, all commercial varieties"),
  ("corn", "Corn, cooked", "Corn, sweet, yellow, cooked, boiled, drained, without salt"),
  ("white-bread", "White bread", "Bread, white, commercially prepared (includes soft bread crumbs)"),
  ("burger-bun", "Hamburger bun", "Rolls, hamburger or hotdog, plain"),
  ("corn-tortilla", "Corn tortilla", "Tortillas, ready-to-bake or -fry, corn"),
  ("pasta", "Pasta, cooked", "Pasta, cooked, enriched, without added salt"),
  ("quinoa", "Quinoa, cooked", "Quinoa, cooked"),
  ("oatmeal", "Oatmeal, cooked with water", "Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt"),
  ("cheddar", "Cheddar cheese", "Cheese, cheddar (Includes foods for USDA's Food Distribution Program)"),
  ("queso-fresco", "Queso fresco", "Cheese, fresh, queso fresco"),
  ("milk", "Whole milk", "Milk, whole, 3.25% milkfat, with added vitamin D"),
  ("olive-oil", "Olive oil", "Oil, olive, salad or cooking"),
  ("butter", "Butter", "Butter, salted"),
  ("sugar", "Sugar", "Sugars, granulated"),
]
NUT = {"1008": "calories", "1005": "carbs_g", "1003": "protein_g", "1004": "fat_g", "1079": "fiber_g", "2000": "sugar_g"}
food = {r["description"]: r["fdc_id"] for r in csv.DictReader(open(os.path.join(src, "food.csv"), encoding="utf-8"))}
missing = [w for w in WANT if w[2] not in food]
for m in missing:
    key = m[2].split(",")[0].lower()
    near = [d for d in food if d.lower().startswith(key)][:8]
    print("MISSING", m[0], "|", m[2], "\n   near:", near)
ids = {food[w[2]]: w for w in WANT if w[2] in food}
nut = {}
for r in csv.DictReader(open(os.path.join(src, "food_nutrient.csv"), encoding="utf-8")):
    if r["fdc_id"] in ids and r["nutrient_id"] in NUT:
        nut.setdefault(r["fdc_id"], {})[NUT[r["nutrient_id"]]] = float(r["amount"])
units = {r["id"]: r["name"] for r in csv.DictReader(open(os.path.join(src, "measure_unit.csv"), encoding="utf-8"))}
portions = {}
for r in csv.DictReader(open(os.path.join(src, "food_portion.csv"), encoding="utf-8")):
    if r["fdc_id"] in ids:
        label = " ".join(x for x in [r["amount"].rstrip("0").rstrip(".") if r["amount"] else "", r["modifier"] or units.get(r["measure_unit_id"], "")] if x).strip()
        portions.setdefault(r["fdc_id"], []).append({"measure": label, "g": float(r["gram_weight"])})
items = []
for fid, (cid, name, desc) in ids.items():
    n = nut.get(fid, {})
    items.append({"id": cid, "name": name, "usda": desc, "fdc_id": int(fid),
                  "per_100g": {k: round(n.get(k, 0.0), 1) for k in ["calories", "carbs_g", "fiber_g", "protein_g", "fat_g", "sugar_g"]},
                  "measures": portions.get(fid, [])[:6]})
items.sort(key=lambda x: [w[0] for w in WANT].index(x["id"]))
json.dump({"source": "USDA FoodData Central, SR Legacy (April 2018 release), per 100 g edible portion; household measures from the same release", "count": len(items), "components": items}, open(out, "w"), indent=1)
print("wrote", len(items), "of", len(WANT))
